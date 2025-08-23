import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as authLogin } from '../features/userSlice';
import Input from '../components/Input';
import Button from '../components/Button';
import { useDispatch } from 'react-redux';
import authService from '../appwrite/auth';
import { useForm } from 'react-hook-form';

function Signin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit } = useForm();
  const [error, setError] = useState('');

  useEffect(() => {
    // ✅ Auto-redirect if already logged in
    const checkSession = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          dispatch(authLogin(userData));
          navigate('/dashboard');
        }
      } catch (err) {
        // no active session, safe to continue
      }
    };
    checkSession();
  }, [dispatch, navigate]);

  const login = async (data) => {
    setError('');
    try {
      // ✅ Check and end active session before login
      const current = await authService.getCurrentUser();
      if (current) {
        await authService.logout(); // end active session
      }

      const session = await authService.login(data);
      if (session) {
        const userData = await authService.getCurrentUser();
        if (userData) dispatch(authLogin(userData));
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Failed to sign in');
    }
  };

  return (
    <div className='flex items-center justify-center w-full'>
      <div
        className={`mx-auto w-full max-w-lg bg-gray-100 rounded-xl p-10 border border-black/10`}
      >
        <h2 className='text-center text-2xl font-bold leading-tight'>
          Sign in to your account
        </h2>
        <p className='mt-2 text-center text-base text-black/60'>
          Don&apos;t have any account?&nbsp;
          <Link
            to='/signup'
            className='font-medium text-primary transition-all duration-200 hover:underline'
          >
            Sign Up
          </Link>
        </p>
        {error && <p className='text-red-600 mt-8 text-center'>{error}</p>}

        <form onSubmit={handleSubmit(login)} className='mt-8'>
          <div className='space-y-5'>
            <Input
              label='Email: '
              placeholder='Enter your email'
              type='email'
              {...register('email', {
                required: 'Email is required',
                validate: {
                  matchPattern: (value) =>
                    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                    'Email address must be valid',
                },
              })}
            />
            <Input
              label='Password: '
              type='password'
              placeholder='Enter your password'
              {...register('password', {
                required: 'Password is required',
              })}
            />
            <Button type='submit' className='w-full'>
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signin;
