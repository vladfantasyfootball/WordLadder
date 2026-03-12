import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/actions';
import { getAuth } from 'firebase/auth';
import config from '../../config';

const ENTITLEMENT_ID = 'premium';

const FEATURES = [
    { icon: 'ban-outline', label: 'No ads between levels' },
    { icon: 'analytics-outline', label: 'View the shortest solution after every puzzle' },
    { icon: 'infinite-outline', label: 'One-time purchase, yours forever' },
];

export default function PaywallScreen({ navigation }) {
    const currentUser = useSelector((state) => state.userState.currentUser);
    const dispatch = useDispatch();

    const [offering, setOffering] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        loadOffering();
    }, []);

    const loadOffering = async () => {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current?.availablePackages?.length) {
                setOffering(offerings.current);
            }
        } catch (error) {
            console.error('Failed to load offerings:', error);
        } finally {
            setLoading(false);
        }
    };

    const unlockPremiumInBackend = async () => {
        const auth = getAuth();
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${config.WORD_LADDER_BACKEND}/api/purchases/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Backend verification failed (${response.status}): ${body}`);
        }
        return await response.json();
    };

    const handlePurchase = async () => {
        if (!offering?.availablePackages?.length) {
            Alert.alert(
                'Not Available',
                'In-app purchase is not available right now. Please try again later.'
            );
            return;
        }
        try {
            setPurchasing(true);
            const { customerInfo } = await Purchases.purchasePackage(offering.availablePackages[0]);
            if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
                const updatedUser = await unlockPremiumInBackend();
                const auth = getAuth();
                await dispatch(updateUser(currentUser.id, updatedUser, auth));
                Alert.alert('🎉 Welcome to Premium!', 'Enjoy no ads and full access to shortest solutions.', [
                    { text: 'Let\'s Go!', onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error) {
            if (!error.userCancelled) {
                console.error('Purchase error:', error?.message ?? error);
                Alert.alert('Purchase Failed', error?.message ?? 'Something went wrong. Please try again.');
            }
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        try {
            setPurchasing(true);
            const customerInfo = await Purchases.restorePurchases();
            if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
                const updatedUser = await unlockPremiumInBackend();
                const auth = getAuth();
                await dispatch(updateUser(currentUser.id, updatedUser, auth));
                Alert.alert('✅ Purchase Restored', 'Your premium access has been restored.', [
                    { text: 'Done', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('No Purchase Found', 'We couldn\'t find a previous purchase to restore.');
            }
        } catch (error) {
            console.error('Restore error:', error);
            Alert.alert('Restore Failed', 'Something went wrong. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    const priceLabel = offering?.availablePackages?.[0]?.product?.priceString ?? '$2.99';

    return (
        <View style={styles.root}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={26} color="#555" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.iconContainer}>
                    <Ionicons name="star" size={52} color="#AF52DE" />
                </View>
                <Text style={styles.title}>Word Ladder Premium</Text>
                <Text style={styles.subtitle}>One-time purchase — unlock everything</Text>

                <View style={styles.featuresCard}>
                    {FEATURES.map((f, i) => (
                        <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}>
                            <Ionicons name={f.icon} size={22} color="#AF52DE" style={styles.featureIcon} />
                            <Text style={styles.featureLabel}>{f.label}</Text>
                        </View>
                    ))}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#AF52DE" style={{ marginTop: 32 }} />
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.purchaseBtn, purchasing && styles.purchaseBtnDisabled]}
                            onPress={handlePurchase}
                            disabled={purchasing}
                            activeOpacity={0.85}
                        >
                            {purchasing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.purchaseBtnText}>Unlock Premium — {priceLabel}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={purchasing}>
                            <Text style={styles.restoreBtnText}>Restore Purchase</Text>
                        </TouchableOpacity>
                    </>
                )}

                <Text style={styles.legalNote}>
                    Payment will be charged to your Apple ID account. This is a one-time purchase.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#fff',
    },
    closeBtn: {
        position: 'absolute',
        top: 54,
        right: 20,
        zIndex: 10,
        padding: 4,
    },
    content: {
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 24,
        backgroundColor: '#F3E8FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 28,
    },
    featuresCard: {
        backgroundColor: '#F9F9F9',
        borderRadius: 16,
        width: '100%',
        overflow: 'hidden',
        marginBottom: 28,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    featureRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#EBEBEB',
    },
    featureIcon: {
        marginRight: 14,
    },
    featureLabel: {
        fontSize: 15,
        color: '#222',
        fontWeight: '500',
        flex: 1,
    },
    purchaseBtn: {
        backgroundColor: '#AF52DE',
        borderRadius: 14,
        width: '100%',
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#AF52DE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 12,
    },
    purchaseBtnDisabled: {
        opacity: 0.6,
    },
    purchaseBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    restoreBtn: {
        paddingVertical: 10,
        marginBottom: 20,
    },
    restoreBtnText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '500',
    },
    legalNote: {
        fontSize: 12,
        color: '#aaa',
        textAlign: 'center',
        lineHeight: 17,
        paddingHorizontal: 10,
    },
});
