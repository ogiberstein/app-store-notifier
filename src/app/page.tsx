'use client';

import React, { useState } from 'react';
import AppList from '@/components/AppList'; // Assuming alias '@/' is configured for src

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [unsubscribeMessage, setUnsubscribeMessage] = useState('');

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleAppSelectionChange = (newSelectedAppIds: string[]) => {
    setSelectedAppIds(newSelectedAppIds);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage('');
    setUnsubscribeMessage('');

    if (!email) {
      setSubmitMessage('Please enter your email address.');
      return;
    }
    if (selectedAppIds.length === 0) {
      setSubmitMessage('Please select at least one app to monitor.');
      return;
    }

    setIsSubscribing(true);
    let successCount = 0;
    const totalApps = selectedAppIds.length;

    for (const appId of selectedAppIds) {
      try {
        const response = await fetch('/api/subscriptions/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, appId }),
        });
        const result = await response.json();
        if (response.ok) {
          console.log(`Successfully subscribed to ${appId} for ${email}:`, result.message);
          successCount++;
        } else {
          console.error(`Failed to subscribe to ${appId} for ${email}:`, result.error);
        }
      } catch (error) {
        console.error(`Error subscribing to ${appId} for ${email}:`, error);
      }
    }

    setIsSubscribing(false);
    if (successCount === totalApps) {
      setSubmitMessage('Successfully subscribed to all selected apps!');
    } else if (successCount > 0) {
      setSubmitMessage(`Partially subscribed. ${successCount} of ${totalApps} apps were successful. Check console for errors.`);
    } else {
      setSubmitMessage('Failed to subscribe to any apps. Please check the console for errors and try again.');
    }
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
        // setSelectedAppIds([]); 
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="you@example.com"
                  disabled={isSubscribing || isUnsubscribing}
                />
              </div>
            </div>

            <AppList onChange={handleAppSelectionChange} initialSelectedApps={selectedAppIds} />

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
          <a href="https://vwape.com" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-500">
            VWAPE
          </a>
        </p>
        <p className="mt-2">
          Want to give a tip? Send ETH or USDC to giberstein.eth on any reasonable EVM chain
        </p>
      </div>
    </div>
  );
}
