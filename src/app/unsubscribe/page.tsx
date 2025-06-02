'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'; // Hook to get URL search params

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [message, setMessage] = useState('Processing your unsubscribe request...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (email) {
      const performUnsubscribe = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/unsubscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          const result = await response.json();
          if (response.ok) {
            setMessage(result.message || `Successfully unsubscribed ${email}.`);
          } else {
            setMessage(result.error || 'Failed to unsubscribe. Please check the email address or try again later.');
          }
        } catch (error) {
          console.error('Unsubscribe API call failed:', error);
          setMessage('An error occurred while trying to unsubscribe. Please try again later.');
        }
        setIsLoading(false);
      };
      performUnsubscribe();
    } else {
      setMessage('No email address provided for unsubscribe.');
      setIsLoading(false);
    }
  }, [email]); // Effect runs when email query param changes

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Unsubscribe
        </h1>
      </div>
      <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 w-full max-w-md">
        {isLoading ? (
          <p className="text-lg text-gray-700">Unsubscribing...</p>
        ) : (
          <p className={`text-lg ${message.includes('Successfully') ? 'text-green-700' : 'text-red-700'}`}>
            {message}
          </p>
        )}
        <div className="mt-6">
          <a 
            href="/" 
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
} 