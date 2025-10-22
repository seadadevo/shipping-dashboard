
import './App.css'
import Admin_Dashboard from './components/Admin_Dashboard'
import Header  from './components/Header'
import Sidebar  from './components/Sidebar'

function App() {

  return (
       <div className="flex h-screen bg-gray-50" dir="rtl">
        <Sidebar/>
           <div className="flex-1 flex flex-col overflow-hidden">
             <Header/>
             <div className='p-2 pr-4'>

    <Admin_Dashboard />
             </div>
            </div>

       </div>
  
    
   
    
  )
}

export default App
