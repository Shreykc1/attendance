from flask import Flask, request, jsonify
import re
import pypdf
from collections import defaultdict
from datetime import datetime
import json
from flask.ext
app = Flask(__name__)
output_data = {}  # Global variable to store processed data

def extract_user_info(text):
    user_info = {}
    patterns = {
        'student_number': r'(\d+)\s+Student Number',
        'student_name': r'Student Number\s+([\w\s]+?)\s+Student Name',
        'roll_no': r'([\w\d]+)\s+Roll No\.',
        'program_name': r'([^\n]+?)\s+Program Name',
        'academic_year': r'([\d-]+)\s+Academic Year',
        'semester': r'Semester\s+(\w+)',
        'report_date': r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})\s+Date of Report Generation',
        'attendance_period': r'([\d\.]+)\s+TO\s+([\d\.]+)'
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, text)
        if match:
            if key == 'attendance_period':
                user_info['attendance_from'] = match.group(1)
                user_info['attendance_to'] = match.group(2)
            else:
                user_info[key] = match.group(1)

    return user_info

def extract_attendance_entries(text):
    pattern = r'(\d+)(.*?)\s+(\w+\s+\d+,\s+\d{4})\s+(\d+:\d+:\d+\s+[AP]M)\s+(\d+:\d+:\d+\s+[AP]M)\s+([PA])'
    matches = re.findall(pattern, text)

    attendance_data = []
    for match in matches:
        sr_no, course_name, date, start_time, end_time, attendance = match
        attendance_data.append({
            'sr_no': sr_no,
            'course_name': course_name.strip(),
            'date': datetime.strptime(date, '%b %d, %Y').date(),
            'start_time': datetime.strptime(start_time, '%I:%M:%S %p').time(),
            'end_time': datetime.strptime(end_time, '%I:%M:%S %p').time(),
            'attendance': 'Present' if attendance == 'P' else 'Absent'
        })

    return attendance_data

def extract_attendance_data(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = pypdf.PdfReader(file)

        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"

        user_info = extract_user_info(full_text)
        attendance_entries = extract_attendance_entries(full_text)

    return user_info, attendance_entries

def calculate_subject_attendance(attendance_entries):
    subject_attendance = defaultdict(lambda: {'present': 0, 'total': 0})
    for entry in attendance_entries:
        subject = entry['course_name']
        subject_attendance[subject]['total'] += 1
        if entry['attendance'] == 'Present':
            subject_attendance[subject]['present'] += 1

    subject_percentages = {}
    skippable_lectures = {}
    for subject, data in subject_attendance.items():
        percentage = (data['present'] / data['total']) * 100 if data['total'] > 0 else 0
        subject_percentages[subject] = percentage

        # Calculate skippable lectures (75% attendance required)
        required_lectures = 0.75 * data['total']
        skippable = max(0, data['present'] - required_lectures)
        skippable_lectures[subject] = int(skippable)

    return subject_percentages, skippable_lectures

def process_attendance():
    pdf_path = 'my.pdf'
    user_info, attendance_entries = extract_attendance_data(pdf_path)

    subject_percentages, skippable_lectures = calculate_subject_attendance(attendance_entries)

    total_entries = len(attendance_entries)
    present_entries = sum(1 for entry in attendance_entries if entry['attendance'] == 'Present')
    absent_entries = sum(1 for entry in attendance_entries if entry['attendance'] == 'Absent')
    attendance_percentage = (present_entries / total_entries) * 100 if total_entries > 0 else 0

    forecast_attend = ((present_entries + 4) / (total_entries + 4)) * 100 if total_entries > 0 else 0
    forecast_miss = ((present_entries - 4) / (total_entries + 4)) * 100 if total_entries > 0 else 0
    missable_classes = sum(skippable_lectures.values())

    # Calculate average lectures per week
    start_date = min(entry['date'] for entry in attendance_entries)
    end_date = max(entry['date'] for entry in attendance_entries)
    weeks = (end_date - start_date).days // 7 + 1
    avg_lectures_per_week = total_entries / weeks if weeks > 0 else 0

    unique_days = len(set(entry['date'] for entry in attendance_entries))
    avg_lectures_per_day = total_entries / unique_days if unique_days > 0 else 0

    # Find the most missed day
    day_absences = defaultdict(int)
    for entry in attendance_entries:
        if entry['attendance'] == 'Absent':
            day_absences[entry['date'].strftime('%A')] += 1
    most_missed_day = max(day_absences, key=day_absences.get) if day_absences else None
    most_attended_day = min(day_absences, key=day_absences.get) if day_absences else None

    global output_data
    output_data = {
        "user_info": user_info,
        "subject_percentages": subject_percentages,
        "skippable_lectures": skippable_lectures,
        "overall_attendance": attendance_percentage,

        "forecast_attend": forecast_attend,
        "forecast_miss": forecast_miss,
        "missable_classes": missable_classes,

        "present_entries": present_entries,
        "absent_entries": absent_entries,
        "total_entries": total_entries,

        "avg_lectures_per_day": avg_lectures_per_day,
        "avg_lectures_per_week": avg_lectures_per_week,
        "most_missed_day": most_missed_day,
        "most_attended_day": most_attended_day,
    }

@app.route('/attendance', methods=['POST'])
def attendance():
    return jsonify(output_data), 200

if __name__ == "__main__":
    process_attendance()  # Preprocess the attendance data
    app.run(host="0.0.0.0", port=3000)
