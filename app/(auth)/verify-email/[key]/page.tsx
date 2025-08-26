'use client'
import { AuthService } from '@/lib/services';
import { useParams } from 'next/navigation';
import React,{useEffect, useState} from 'react'

const VerifyEmailPage = () => {
      const {key} = useParams<{ key:string }>()
      
   const [status,setStatus] =useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
    if (!key) return setStatus("error");
    const verifyEmail = async () => {
        setStatus("verifying");
        const response = await AuthService.verifyEmail(key as string);  

        // Check if response has error
        if (response?.error) {
          setStatus("error");
          setErrorMessage(response.error?.message || 'An error occurred while verifying your email');
          return;
        } 
        if (response?.message && response?.access  && response.refresh && response.user ) {
          setStatus("success");
          // Redirect to dashboard
          setTimeout(() => {
           window.location.href = '/dashboard';
          }, 2000);
        }
     
    };

    verifyEmail();
  }, [key]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      {status === 'verifying' && (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Verifying your email....</h1>
          <p className="text-gray-600">Please wait while we confirm your email address.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
        
          <p className="text-gray-600">Your email has been successfully verified.</p>
          <p className="mt-2 text-blue-600">Redirecting to dashboard...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Verification Failed</h1>
          <p className="text-gray-600">
            {errorMessage}
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-4 px-4 py-2 font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  </div>
  );
      
}

export default VerifyEmailPage