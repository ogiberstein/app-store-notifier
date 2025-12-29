'use client';

import React, { useState } from 'react';
import AppList, { AppItem } from '@/components/AppList'; // Assuming alias '@/' is configured for src

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [selectedApps, setSelectedApps] = useState<AppItem[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [unsubscribeMessage, setUnsubscribeMessage] = useState('');

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleAppSelectionChange = (newSelectedApps: AppItem[]) => {
    setSelectedApps(newSelectedApps);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage('');
    setUnsubscribeMessage('');

    if (!email) {
      setSubmitMessage('Please enter your email address.');
      return;
    }
    if (selectedApps.length === 0) {
      setSubmitMessage('Please select at least one app to monitor.');
      return;
    }

    setIsSubscribing(true);
    
    try {
      const response = await fetch('/api/subscriptions/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          apps: selectedApps.map(app => ({ appId: app.id, appName: app.name }))
        }),
      });
      const result = await response.json();
      
      if (response.ok) {
        setSubmitMessage('Successfully subscribed! Check your email for confirmation.');
      } else {
        setSubmitMessage(result.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setSubmitMessage('An error occurred. Please try again.');
    }
    
    setIsSubscribing(false);
  };

  const handleUnsubscribe = async () => {
    setSubmitMessage('');
    setUnsubscribeMessage('');
    if (!email) {
      setUnsubscribeMessage('Please enter your email address to unsubscribe.');
      return;
    }

    setIsUnsubscribing(true);
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
        setUnsubscribeMessage(result.message || 'Successfully unsubscribed from all apps for this email.');
        // Optionally clear selected apps if the user unsubscribes
        // setSelectedApps([]); 
      } else {
        setUnsubscribeMessage(result.error || 'Failed to unsubscribe. Please try again.');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setUnsubscribeMessage('An error occurred while trying to unsubscribe. Please check the console.');
    }
    setIsUnsubscribing(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          App Store Notifier
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Get daily email updates for your favorite app store rankings.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                  placeholder="you@example.com"
                  disabled={isSubscribing || isUnsubscribing}
                />
              </div>
            </div>

            <AppList onChange={handleAppSelectionChange} initialSelectedApps={selectedApps.map(app => app.id)} />

            {submitMessage && (
              <p className={`text-sm ${submitMessage.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {submitMessage}
              </p>
            )}
            {unsubscribeMessage && (
              <p className={`text-sm ${unsubscribeMessage.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {unsubscribeMessage}
              </p>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubscribing || isUnsubscribing}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
              <button
                type="button" // Important: type="button" to prevent form submission
                onClick={handleUnsubscribe}
                disabled={isUnsubscribing || isSubscribing}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isUnsubscribing ? 'Unsubscribing...' : 'Unsubscribe from All'}
              </button>
            </div>
            
            <p className="mt-4 text-center text-sm text-gray-500">
              Want to track a different app?{' '}
              <a 
                href="https://forms.gle/1tsh2DwPZP261ZQs8" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Request it here
              </a>
            </p>
          </form>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500">
        <p>
          By the creator of{' '}
          <a href="https://coinrule.com" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-500">
            Coinrule
          </a>{' '}
          &{' '}
          <a href="https://limits.trade" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-500">
            Limits
          </a>
        </p>
        <p className="mt-2">
          Want to give a tip? Send ETH or USDC to giberstein.eth on any reasonable EVM chain
        </p>
      </div>
    </div>
  );
}
