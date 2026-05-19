import React, { useState, useEffect } from 'react'
import { View, Text, Switch, StyleSheet, Alert, Linking, TouchableOpacity, TextInput } from 'react-native'
import LogoutButton from '../shared/logoutButton';
import { getAuth } from 'firebase/auth';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { updateUser, saveLeaderboardName } from '../../redux/actions/index';
import { registerForPushNotificationsAsync, checkNotificationPermissions } from '../../utils/notifications';
import axios from 'axios';
import config from '../../config';

function ProfilePage({ navigation, level, currentUser, updateUser, saveLeaderboardName }) {
    const auth = getAuth()
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [soundsLoading, setSoundsLoading] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [nameError, setNameError] = useState('');
    const [nameSaving, setNameSaving] = useState(false);

    useEffect(() => {
        if (currentUser?.notifications) {
            setNotificationsEnabled(currentUser.notifications.enabled || false);
        }
    }, [currentUser]);

    const handleSaveLeaderboardName = async () => {
        const trimmed = nameInput.trim();
        if (!/^[a-zA-Z ]{1,20}$/.test(trimmed)) {
            setNameError('Letters and spaces only, max 20 characters.');
            return;
        }
        setNameError('');
        setNameSaving(true);
        try {
            await saveLeaderboardName(trimmed, auth);
            setEditingName(false);
        } catch (e) {
            setNameError(e?.response?.data || 'Something went wrong.');
        } finally {
            setNameSaving(false);
        }
    };

    const logoutFunction = async () => {
        await auth.signOut().catch((e) => {
            console.error('Error signing out:', e)
        })
    }

    const handleSoundEffectsToggle = async (value) => {
        if (soundsLoading) return;
        setSoundsLoading(true);
        try {
            const updatedUser = { ...currentUser, soundEffectsEnabled: value };
            await updateUser(currentUser.id, updatedUser, auth);
        } catch (error) {
            console.error('Error updating sound effects setting:', error);
        } finally {
            setSoundsLoading(false);
        }
    };

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
                <Text style={styles.sectionTitle}>Leaderboard Name</Text>
                {editingName ? (
                    <View>
                        <TextInput
                            style={styles.nameInput}
                            value={nameInput}
                            onChangeText={t => {
                                const filtered = t.replace(/[^a-zA-Z ]/g, '');
                                if (filtered !== t) {
                                    setNameError('Letters and spaces only.');
                                } else {
                                    setNameError('');
                                }
                                setNameInput(filtered);
                            }}
                            placeholder="e.g. Word Wizard"
                            placeholderTextColor="#999"
                            maxLength={20}
                            autoCapitalize="words"
                            autoCorrect={false}
                            autoFocus
                        />
                        {nameError ? <Text style={styles.nameError}>{nameError}</Text> : null}
                        <View style={styles.nameButtonRow}>
                            <TouchableOpacity
                                style={[styles.nameSaveButton, nameSaving && { opacity: 0.6 }]}
                                onPress={handleSaveLeaderboardName}
                                disabled={nameSaving}
                            >
                                <Text style={styles.nameSaveText}>{nameSaving ? 'Saving…' : 'Save'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.nameCancelButton}
                                onPress={() => { setEditingName(false); setNameError(''); }}
                            >
                                <Text style={styles.nameCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>
                                {currentUser?.leaderboardName || 'Not set'}
                            </Text>
                            <Text style={styles.settingDescription}>
                                How you appear on leaderboards
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                setNameInput(currentUser?.leaderboardName || '');
                                setNameError('');
                                setEditingName(true);
                            }}
                        >
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sound Effects</Text>
                <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingLabel}>Game Sounds</Text>
                        <Text style={styles.settingDescription}>
                            Play sounds for submissions and level completions
                        </Text>
                    </View>
                    <Switch
                        value={currentUser?.soundEffectsEnabled !== false}
                        onValueChange={handleSoundEffectsToggle}
                        disabled={soundsLoading}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={currentUser?.soundEffectsEnabled !== false ? '#007AFF' : '#f4f3f4'}
                    />
                </View>
            </View>
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
    nameInput: {
        borderWidth: 1.5,
        borderColor: '#DDD',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        fontSize: 16,
        color: '#111',
        marginBottom: 6,
    },
    nameError: {
        fontSize: 13,
        color: '#E53935',
        marginBottom: 8,
    },
    nameButtonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    nameSaveButton: {
        flex: 1,
        backgroundColor: '#FFD60A',
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: 'center',
    },
    nameSaveText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
    },
    nameCancelButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: 'center',
    },
    nameCancelText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#555',
    },
    editText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#007AFF',
    },
});

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({ updateUser, saveLeaderboardName }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ProfilePage);