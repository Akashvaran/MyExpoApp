import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Axios from '../axios/Axios';
import { AuthContext } from '../productedRoute/AuthanticationContext';
import { useNavigation } from '@react-navigation/native';

const AuthSignUp = () => {
    const [formData, setFormData] = useState({ name: '', email: '', mobile: '', password: '' });
    const [errors, setErrors] = useState({});
    const {login}=useContext(AuthContext)
    const Navication=useNavigation()

    const handleChange = (name, value) => {

        const processedValue = name === 'email' ? value.toLowerCase() : value;
        setFormData((prevData) => ({ ...prevData, [name]: processedValue }));
    };

    const validateForm = () => {
        const validationErrors = {};

        if (!formData.name.trim()) {
            validationErrors.name = 'Name is required';
        } else if (formData.name.length <= 5) {
            validationErrors.name = 'Name must be greater than 5 character';
        }
        if (!formData.email.trim()) {
            validationErrors.email = 'Email is required';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
            validationErrors.email = 'Invalid email format';
        }
        if (!formData.mobile.trim()) {
            validationErrors.mobile = 'Mobile number is required';
        } else if (!/^\d{10}$/.test(formData.mobile)) {
            validationErrors.mobile = 'Mobile number must be exactly 10 digits';
        }
        if (!formData.password.trim()) {
            validationErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            validationErrors.password = 'Password must be at least 6 characters long';
        }

        return validationErrors;
    };

    const handleSubmit = async () => {
        const validationErrors = validateForm();
        setErrors(validationErrors);
      
        if (Object.keys(validationErrors).length === 0) {
          try {
            const response = await Axios.post('/auth/signup', formData);
            const user = response.data.user;
            login(user);
            if (user) {
              Alert.alert('Success', 'Signup successful!');
              Navication.navigate('Main');
             
              setFormData({ name: '', email: '', mobile: '', password: '' });
              setErrors({});
            }
          } catch (error) {
            if (error.response?.data?.errors) {
              setErrors(error.response.data.errors);
            } else {
              Alert.alert('Error', error.response?.data?.message || 'Signup failed. Please try again.');
            }
          }
        }
      };

    return (
        <View style={styles.container}>
            {/* <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity> */}

            <Text style={styles.title}>Signup</Text>

            <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter your name"
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TextInput
                style={[styles.input, errors.mobile && styles.inputError]}
                placeholder="Enter your mobile number"
                value={formData.mobile}
                onChangeText={(value) => handleChange('mobile', value)}
                keyboardType="numeric"
            />
            {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

            <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Signup</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={()=>Navication.navigate('Login')}>
                <Text style={styles.linkText}>Already have an account? Login</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    input: {
        width: '100%',
        padding: 12,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
    },
    inputError: {
        borderColor: '#e74c3c',
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 14,
        marginBottom: 5,
    },
    
    button: {
        width: '100%',
        backgroundColor: '#34db45',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkText: {
        marginTop: 15,
        color: '#3498db',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});

export default AuthSignUp;