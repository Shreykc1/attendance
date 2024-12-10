import './App.css'
import Charts from '../components/Charts'
function App() {

  return (
    <div className='min-h-screen w-screen bg-black text-white tracking-tight flex justify-center items-center overflow-hidden flex-col font-geist '>
        <h1 className='font-extrabold text-6xl mt-20'>
            Welcome Shrey
        </h1>
        <div className='h-[800px] w-[800px] flex justify-center items-center'>
            <Charts />
        </div>
    </div>
  )
}

export default App
