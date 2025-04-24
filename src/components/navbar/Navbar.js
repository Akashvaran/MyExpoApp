import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Login from '../authentication/Login';
import AuthSignUp from '../authentication/AuthSignUp';
import { AuthContext } from '../productedRoute/AuthanticationContext';
import { useNavigation } from '@react-navigation/native';

const Navbar = () => {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const { isLoggedIn, logout, user } = useContext(AuthContext);

    const navigation = useNavigation();

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        setShowProfileDropdown(false);
    };

    return (
        <View style={styles.navbar}>
            <View style={styles.navbarLogo}>
                <Ionicons name="chatbubbles" size={30} color="#ecf0f1" />
                <Text style={styles.navbarTitle}>ChatApp</Text>
            </View>

            <View style={styles.navbarLinks}>
                {isLoggedIn ? (
                    <View style={styles.profileContainer}>
                        <TouchableOpacity
                            onPress={() => setShowProfileDropdown(!showProfileDropdown)}
                            style={styles.profileButton}
                        >
                            {user?.profileImage ? (
                                <Image
                                    source={{ uri: user.profileImage }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <Ionicons name="person-circle" size={40} color="#ecf0f1" />
                            )}
                        </TouchableOpacity>

                        {showProfileDropdown && (
                            <View style={styles.dropdownMenu}>
                                <View style={styles.dropdownHeader}>
                                    <TouchableOpacity onPress={() => setShowProfileDropdown(false)}>
                                        <Ionicons name="close" size={20} color="#555" />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {

                                        setShowProfileDropdown(false);
                                    }}
                                >
                                    <Ionicons name="person" size={20} color="#555" style={styles.dropdownIcon} />
                                    <Text style={styles.dropdownText}>View Profile</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        navigation.navigate('NewGroup');
                                        setShowProfileDropdown(false);
                                    }}
                                >
                                    <Ionicons name="people" size={20} color="#555" style={styles.dropdownIcon} />
                                    <Text style={styles.dropdownText}>Add new group</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setShowLogoutModal(true);
                                        setShowProfileDropdown(false);
                                    }}
                                >
                                    <Ionicons name="log-out" size={20} color="#555" style={styles.dropdownIcon} />
                                    <Text style={styles.dropdownText}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ) : (
                    <>
                        <TouchableOpacity style={styles.button} onPress={() => setShowLoginModal(true)}>

                            <Text style={styles.buttonText}>Login</Text>
                        </TouchableOpacity>
                    
                    </>
                )}
            </View>

            <Modal visible={showLogoutModal} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons
                            name="close"
                            size={24}
                            color="#555"
                            style={styles.closeModalIcon}
                            onPress={() => setShowLogoutModal(false)}
                        />
                        <Text style={styles.modalTitle}>Are you sure you want to logout?</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.confirmButton} onPress={handleLogout}>
                                <Text style={styles.buttonText}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLogoutModal(false)}>
                                <Text style={styles.buttonText}>No</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showLoginModal} transparent={true} animationType="slide">

                <Login onClose={() => setShowLoginModal(false)} />
            </Modal>

            <Modal visible={showSignupModal} transparent={true} animationType="slide">
                <AuthSignUp onClose={() => setShowSignupModal(false)} />
            </Modal>
        </View>
    );
};

export default Navbar;

const styles = StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2c3e50',
        padding: 10,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    navbarLogo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navbarTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ecf0f1',
        marginLeft: 10,
    },
    navbarLinks: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    profileContainer: {
        position: 'relative',
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 50,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 150,
        zIndex: 1001,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    dropdownIcon: {
        marginRight: 10,
    },
    dropdownText: {
        fontSize: 16,
        color: '#555',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#3498db',
        padding: 10,
        borderRadius: 5,
    },
    buttonPrimary: {
        backgroundColor: '#34db45',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    closeModalIcon: {
        alignSelf: 'flex-end',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    confirmButton: {
        backgroundColor: '#e74c3c',
        padding: 10,
        borderRadius: 5,
    },
    cancelButton: {
        backgroundColor: '#bdc3c7',
        padding: 10,
        borderRadius: 5,
    },
});