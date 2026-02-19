import React from 'react'

const NotificationModal = ( {handleShowModal} : {handleShowModal: () => void} ) => {
  return (
    <div className="w-full h-full fixed inset-0 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50" 
    onClick={handleShowModal}>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Notification</h2>
        <p className="mb-4">This is a notification modal.</p>
        <button 
          onClick={handleShowModal}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default NotificationModal