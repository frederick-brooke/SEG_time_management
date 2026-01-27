//tells file to run in browser not server
'use client'
//create a container to share data, let components access the shared data, stores data that can change, runs code when component loads or changes
import {createContext, useContext, useState, useEffect} from 'react'
//navigate pages programmatically
import {useRouter} from 'next/navigation'

const AuthContext = createContext(undefined)

export function AuthProvider({children}){
    //store the logged in user's data or null, and function to update the user data
    const [user, setUser] = useState(null)
    //true while checking if user logged in, function to update the loading state
    const [isLoading, setIsLoading] = useState(true)
    //redirect users
    const router = useRouter()

    // Check if user is already logged in when app loads
    useEffect(()=>{
        const token = localStorage.getItem('authToken')
        const userData = localStorage.getItem('user')
        if (token && userData) {
            setUser(JSON.parse(userData))
        }
        setIsLoading(false)
    }, [])

    // Login function
    const login = async (email, password) => {
        try {
            // Send login request to YOUR backend
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
                throw new Error('Login failed')
            }

            const data = await response.json()
            
            // Store token and user data in browser
            localStorage.setItem('authToken', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            
            // Update state so app knows user is logged in
            setUser(data.user)
            
            // Redirect to dashboard
            router.push('/dashboard')
            
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Logout function
    const logout = () => {
        // Remove token from browser storage
        localStorage.removeItem('authToken')
        // Remove user data from browser storage
        localStorage.removeItem('user')
        // Update state - user is now null (not logged in)
        setUser(null)
        // Redirect to login page
        router.push('/login')
    }

    // Register function (optional - if you want users to sign up)
    const register = async (email, password, name) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, name }),
            })

            if (!response.ok) {
                throw new Error('Registration failed')
            }

            const data = await response.json()
            
            // Auto-login after successful registration
            localStorage.setItem('authToken', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            
            setUser(data.user)
            router.push('/dashboard')
            
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Put all our data and functions into the "backpack" (Context value)
    const value = {
        user,          // Current user data (or null if not logged in)
        login,         // Function to log in
        logout,        // Function to log out
        register,      // Function to register new user
        isLoading,     // Are we still checking if user is logged in?
    }

    // Provide the "backpack" to all child components
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook - makes it easy to use auth in other components
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
