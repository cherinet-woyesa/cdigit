// src/components/OtpLoginForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './authService';

interface OtpLoginFormProps {
    onLoginSuccess: () => void;
}

const OtpLoginForm: React.FC<OtpLoginFormProps> = ({ onLoginSuccess }) => {
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [otp, setOtp] = useState<string>('');
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const response = await authService.requestOtp(phoneNumber);
            setMessage(response.message || 'OTP sent! Please check your phone.');
            setStep('verify');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please ensure the phone number is registered and valid.');
            console.error('Request OTP Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginWithOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const response = await authService.loginWithOtp(phoneNumber, otp);
            setMessage(response.message || 'Login successful!');
            if (onLoginSuccess) {
                onLoginSuccess();
            }
            navigate('/employees');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
            console.error('Login with OTP Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Login with OTP</h2>

            {message && <p style={{ color: 'green', textAlign: 'center', marginBottom: '15px' }}>{message}</p>}
            {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

            {step === 'request' && (
                <form onSubmit={handleRequestOtp}>
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="phoneNumber" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone Number:</label>
                        <input
                            type="text"
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g., +251912345678"
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </form>
            )}

            {step === 'verify' && (
                <form onSubmit={handleLoginWithOtp}>
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="otp" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Enter OTP:</label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            placeholder="e.g., 123456"
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setStep('request');
                            setMessage('');
                            setError('');
                            setOtp('');
                        }}
                        disabled={isLoading}
                        style={{
                            width: '100%', padding: '8px', marginTop: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        Resend OTP
                    </button>
                </form>
            )}
        </div>
    );
};

export default OtpLoginForm;