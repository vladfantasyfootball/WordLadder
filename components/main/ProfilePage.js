import React, { useState, useEffect } from 'react'
import { View, Text, Switch, StyleSheet, Alert, Linking, TouchableOpacity } from 'react-native'
import LogoutButton from '../shared/logoutButton'
import { getAuth } from 'firebase/auth';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { updateUser } from '../../redux/actions/index';
import { registerForPushNotificationsAsync, checkNotificationPermissions } from '../../utils/notifications';
import axios from 'axios';
import config from '../../config';

function ProfilePage({ navigation, level, currentUser, updateUser }) {
    const auth = getAuth()
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (currentUser?.notifications) {
            setNotificationsEnabled(currentUser.notifications.enabled || false);
        }
    }, [currentUser]);

    const logoutFunction = async () => {
        await auth.signOut().catch((e) => {
            console.error('Error signing out:', e)
        })
    }

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all your progress. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await auth.currentUser.getIdToken();
                            await axios.delete(`${config.WORD_LADDER_BACKEND}/api/deleteUser`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            await auth.signOut();
                        } catch (e) {
                            console.error('Error deleting account:', e);
                            Alert.alert('Error', 'Failed to delete account. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleNotificationToggle = async (value) => {
        if (isLoading) return;
        
        setIsLoading(true);
        
        try {
            if (value) {
                // User wants to enable notifications
                const hasPermission = await checkNotificationPermissions();
                
                if (!hasPermission) {
                    Alert.alert(
                        "Enable Notifications",
                        "Allow Word Ladder to send you daily puzzle reminders?",
                        [
                            {
                                text: "Not Now",
                                style: "cancel",
                                onPress: () => setIsLoading(false)
                            },
                            {
                                text: "Allow",
                                onPress: async () => {
                                    const token = await registerForPushNotificationsAsync();
                                    if (token) {
                                        await updateNotificationSettings(true, token);
                                    } else {
                                        // Permission was denied, offer to open settings
                                        Alert.alert(
                                            "Notifications Blocked",
                                            "Please enable notifications in Settings to receive daily puzzle reminders.",
                                            [
                                                {
                                                    text: "Cancel",
                                                    style: "cancel",
                                                    onPress: () => setIsLoading(false)
                                                },
                                                {
                                                    text: "Open Settings",
                                                    onPress: () => {
                                                        Linking.openSettings();
                                                        setIsLoading(false);
                                                    }
                                                }
                                            ]
                                        );
                                    }
                                }
                            }
                        ]
                    );
                } else {
                    // Already has permission, just need to get/update token
                    const token = await registerForPushNotificationsAsync();
                    if (token) {
                        await updateNotificationSettings(true, token);
                    } else {
                        setIsLoading(false);
                        Alert.alert("Error", "Failed to register for notifications");
                    }
                }
            } else {
                // User wants to disable notifications
                await updateNotificationSettings(false, null);
            }
        } catch (error) {
            console.error('Error handling notification toggle:', error);
            Alert.alert("Error", "Failed to update notification settings");
            setIsLoading(false);
        }
    };

    const updateNotificationSettings = async (enabled, token) => {
        try {
            const updatedUser = {
                ...currentUser,
                notifications: {
                    enabled: enabled,
                    expoPushToken: token
                }
            };
            
            await updateUser(currentUser.id, updatedUser, auth);
            setNotificationsEnabled(enabled);
            
            if (enabled) {
                Alert.alert(
                    "Notifications Enabled",
                    "You'll receive a daily reminder if you haven't played today's puzzle!"
                );
            }
        } catch (error) {
            console.error('Error updating notification settings:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingLabel}>Daily Puzzle Reminder</Text>
                        <Text style={styles.settingDescription}>
                            Get notified when a new puzzle is available
                        </Text>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={handleNotificationToggle}
                        disabled={isLoading}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={notificationsEnabled ? '#007AFF' : '#f4f3f4'}
                    />
                </View>
            </View>
            
            <View style={styles.logoutContainer}>
                <LogoutButton auth={auth} onClickLogout={() => {logoutFunction()}}/>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                    <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        color: '#000',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
    },
    settingTextContainer: {
        flex: 1,
        marginRight: 15,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: '#666',
    },
    logoutContainer: {
        marginTop: 'auto',
    },
    deleteButton: {
        marginTop: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '500',
    },
});

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({ updateUser }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ProfilePage);