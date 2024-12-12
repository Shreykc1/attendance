const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const moment = require('moment');

const app = express();

app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:5173' }));

let outputData = {}; // Global variable to store processed data

const extractUserInfo = (text) => {
    const userInfo = {};
    const patterns = {
        studentNumber: /Student Number:\s+(\d+)/,
        studentName: /Student Name:\s+([\w\s]+)/,
        rollNo: /Roll No:\s+([\w\d]+)/,
        programName: /Program Name:\s+([^]+)/,
        academicYear: /Academic Year:\s+([\d-]+)/,
        semester: /Semester:\s+(\w+)/,
        reportDate: /Date of Report Generation:\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})/,
        attendancePeriod: /Attendance Period:\s+([\d\.]+)\s+TO\s+([\d\.]+)/
    };

    for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match) {
            if (key === 'attendancePeriod') {
                userInfo.attendanceFrom = match[1];
                userInfo.attendanceTo = match[2];
            } else {
                userInfo[key] = match[1].trim();
            }
        }
    }

    return userInfo;
};

const extractAttendanceEntries = (text) => {
    const pattern = /^(\d+)\s+([\w\s]+?)\s+(\w+\s+\d+,\s+\d{4})\s+(\d+:\d+:\d+\s+[AP]M)\s+(\d+:\d+:\d+\s+[AP]M)\s+([PA])/gm;
    const matches = [...text.matchAll(pattern)];

    return matches.map(match => ({
        srNo: match[1],
        courseName: match[2].trim(),
        date: moment(match[3], 'MMM D, YYYY').toDate(),
        startTime: moment(match[4], 'hh:mm:ss A').toDate(),
        endTime: moment(match[5], 'hh:mm:ss A').toDate(),
        attendance: match[6] === 'P' ? 'Present' : 'Absent'
    }));
};

const calculateSubjectAttendance = (attendanceEntries) => {
    const subjectAttendance = {};

    attendanceEntries.forEach(entry => {
        const subject = entry.courseName;
        if (!subjectAttendance[subject]) {
            subjectAttendance[subject] = { present: 0, total: 0 };
        }
        subjectAttendance[subject].total++;
        if (entry.attendance === 'Present') {
            subjectAttendance[subject].present++;
        }
    });

    const subjectPercentages = {};
    const skippableLectures = {};

    for (const [subject, data] of Object.entries(subjectAttendance)) {
        const percentage = ((data.present / data.total) * 100).toFixed(2) || 0;
        subjectPercentages[subject] = parseFloat(percentage);

        const requiredLectures = 0.75 * data.total;
        skippableLectures[subject] = Math.max(0, data.present - requiredLectures);
    }

    return { subjectPercentages, skippableLectures };
};

const processAttendance = async (pdfPath) => {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(pdfBuffer);

    const fullText = data.text;
    console.log('Extracted Text:', fullText); // Debugging log

    const userInfo = extractUserInfo(fullText);
    console.log('User Info:', userInfo); // Debugging log

    const attendanceEntries = extractAttendanceEntries(fullText);
    console.log('Attendance Entries:', attendanceEntries); // Debugging log

    if (attendanceEntries.length === 0) {
        throw new Error('No attendance entries found.');
    }

    const { subjectPercentages, skippableLectures } = calculateSubjectAttendance(attendanceEntries);

    const totalEntries = attendanceEntries.length;
    const presentEntries = attendanceEntries.filter(entry => entry.attendance === 'Present').length;
    const absentEntries = attendanceEntries.filter(entry => entry.attendance === 'Absent').length;

    const attendancePercentage = ((presentEntries / totalEntries) * 100).toFixed(2) || 0;
    const forecastAttend = (((presentEntries + 4) / (totalEntries + 4)) * 100).toFixed(2) || 0;
    const forecastMiss = (((presentEntries - 4) / (totalEntries + 4)) * 100).toFixed(2) || 0;
    const missableClasses = Object.values(skippableLectures).reduce((a, b) => a + b, 0);

    const startDate = moment.min(attendanceEntries.map(e => moment(e.date)));
    const endDate = moment.max(attendanceEntries.map(e => moment(e.date)));
    const weeks = Math.ceil(endDate.diff(startDate, 'days') / 7) || 1;
    const avgLecturesPerWeek = (totalEntries / weeks).toFixed(2) || 0;

    const uniqueDays = new Set(attendanceEntries.map(e => moment(e.date).format('YYYY-MM-DD'))).size;
    const avgLecturesPerDay = (totalEntries / uniqueDays).toFixed(2) || 0;

    const dayAbsences = {};
    attendanceEntries.forEach(entry => {
        const day = moment(entry.date).format('dddd');
        if (entry.attendance === 'Absent') {
            dayAbsences[day] = (dayAbsences[day] || 0) + 1;
        }
    });

    const mostMissedDay = Object.keys(dayAbsences).reduce((a, b) => (dayAbsences[a] > dayAbsences[b] ? a : b), '') || 'N/A';
    const mostAttendedDay = Object.keys(dayAbsences).reduce((a, b) => (dayAbsences[a] < dayAbsences[b] ? a : b), '') || 'N/A';

    outputData = {
        userInfo,
        subjectPercentages: subjectPercentages || {},
        skippableLectures: skippableLectures || {},
        overallAttendance: parseFloat(attendancePercentage) || 0,
        forecastAttend: parseFloat(forecastAttend) || 0,
        forecastMiss: parseFloat(forecastMiss) || 0,
        missableClasses: missableClasses || 0,
        presentEntries: presentEntries || 0,
        absentEntries: absentEntries || 0,
        totalEntries: totalEntries || 0,
        avgLecturesPerDay: parseFloat(avgLecturesPerDay) || 0,
        avgLecturesPerWeek: parseFloat(avgLecturesPerWeek) || 0,
        mostMissedDay: mostMissedDay || '',
        mostAttendedDay: mostAttendedDay || ''
    };


app.post('/attendance', async (req, res) => {
    try {
        await processAttendance('my.pdf');
        res.status(200).json(outputData);
    } catch (error) {
        console.error('Error:', error.message); // Debugging log
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
