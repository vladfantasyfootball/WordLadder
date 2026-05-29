import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, Modal, Share, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getAuth } from 'firebase/auth';
import { fetchLeaderboard, saveLeaderboardName, fetchGroupLeaderboard, createLeaderboardGroup, leaveLeaderboardGroup, renameLeaderboardGroup } from '../../redux/actions';
import { levelColorScheme } from '../../redux/constants/colorScheme';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import config from '../../config';

function formatValue(category, val) {
    if (val == null) return '—';
    if (category === 'averageScore') return val.toFixed ? val.toFixed(1) : String(val);
    if (category === 'currentStreak' || category === 'longestStreak') return `${val} days`;
    return Number(val).toLocaleString();
}

function LeaderboardEntries({ entries, currentUserId, currentUser, category, listTitle, showEllipsis, isGroup, userRank, userScore, userDisplayName, maxHeight }) {
    // Estimated row height: paddingVertical 14×2 + ~22px text + 1px divider ≈ 51px
    const ROW_HEIGHT = 51;
    const [innerScrollY, setInnerScrollY] = useState(0);

    const userInList = entries.some(e => e.userId === currentUserId);
    const userRankIdx = userRank != null ? userRank - 1 : -1;
    const userRowY = userRankIdx >= 0 ? userRankIdx * ROW_HEIGHT : -1;
    const isUserVisibleInScroll = userRowY >= 0 &&
        userRowY >= innerScrollY &&
        (userRowY + ROW_HEIGHT) <= (innerScrollY + (maxHeight ?? 9999));

    const showStickyUser = isGroup
        ? (userInList && !isUserVisibleInScroll && userRank !== null)
        : (showEllipsis && !userInList && userRank !== null);

    // Sticky goes to TOP when user scrolled DOWN past their row (now looking at lower-ranked people)
    const groupStickyAtTop = isGroup && showStickyUser && innerScrollY > userRowY + ROW_HEIGHT / 2;

    const renderRow = (entry, index, total) => {
        const isUser = entry.userId === currentUserId;
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
        const isLast = index === total - 1;
        return (
            <View key={entry.userId}>
                <View style={[styles.row, isUser && styles.rowHighlighted]}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                    <View style={styles.nameScoreCol}>
                        {(() => {
                            const name = isUser ? (currentUser?.leaderboardName || null) : entry.displayName;
                            return name ? (
                                <Text style={[styles.displayName, isUser && styles.displayNameHighlighted]} numberOfLines={1}>{name}</Text>
                            ) : null;
                        })()}
                        <Text style={[styles.scoreText, isUser && styles.scoreHighlighted]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                            {formatValue(category, entry[category])}
                        </Text>
                    </View>
                    {isUser && <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>}
                    {medal && !isUser && <Text style={styles.medalText}>{medal}</Text>}
                    {medal && isUser && <Text style={[styles.medalText, { marginLeft: 6 }]}>{medal}</Text>}
                </View>
                {!isLast && <View style={styles.rowDivider} />}
            </View>
        );
    };

    const youRow = showStickyUser ? (
        <View style={[styles.row, styles.rowHighlighted]}>
            <Text style={styles.rankNumber}>{userRank}</Text>
            <View style={styles.nameScoreCol}>
                {(userDisplayName || currentUser?.leaderboardName) ? (
                    <Text style={[styles.displayName, styles.displayNameHighlighted]} numberOfLines={1}>
                        {userDisplayName || currentUser?.leaderboardName}
                    </Text>
                ) : null}
                <Text style={[styles.scoreText, styles.scoreHighlighted]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                    {formatValue(category, userScore)}
                </Text>
            </View>
            <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>
        </View>
    ) : null;

    // YOU row at top: you're above the viewport (scrolled down past your row)
    const stickyTop = showStickyUser && groupStickyAtTop ? (
        <>
            {youRow}
            <View style={styles.ellipsisRow}><Text style={styles.ellipsisText}>• • •</Text></View>
            <View style={styles.rowDivider} />
        </>
    ) : null;

    // YOU row at bottom: global always-bottom, or group scrolled up above your row
    const stickyBottom = showStickyUser && !groupStickyAtTop ? (
        <>
            <View style={styles.rowDivider} />
            <View style={styles.ellipsisRow}><Text style={styles.ellipsisText}>• • •</Text></View>
            {youRow}
        </>
    ) : null;

    return (
        <View style={[styles.listContainer, maxHeight != null && { maxHeight }]}>
            <Text style={styles.listTitle}>{listTitle}</Text>
            {entries.length === 0 && (
                <Text style={styles.emptyText}>No entries yet — be the first!</Text>
            )}
            {stickyTop}
            {isGroup ? (
                <ScrollView
                    style={maxHeight != null ? { maxHeight: maxHeight - 50 } : {}}
                    nestedScrollEnabled={true}
                    scrollEnabled={maxHeight != null && entries.length * ROW_HEIGHT > maxHeight - 50}
                    showsVerticalScrollIndicator={maxHeight != null && entries.length * ROW_HEIGHT > maxHeight - 50}
                    onScroll={(e) => setInnerScrollY(e.nativeEvent.contentOffset.y)}
                    scrollEventThrottle={16}
                >
                    {entries.map((entry, index) => renderRow(entry, index, entries.length))}
                </ScrollView>
            ) : (
                entries.map((entry, index) => (
                    <Animatable.View key={entry.userId} animation="fadeInUp" duration={400} delay={index * 60}>
                        {renderRow(entry, index, entries.length)}
                    </Animatable.View>
                ))
            )}
            {stickyBottom}
        </View>
    );
}

export default function LeaderboardDetail({ route }) {
    const { level, category } = route.params;
    const dispatch = useDispatch();
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;

    const currentUser = useSelector((state) => state.userState?.currentUser);
    const leaderboardData = useSelector((state) => state.leaderboardState?.[level]?.[category]);
    const groups = useSelector((state) => state.leaderboardGroupsState?.groups ?? []);
    const groupLeaderboards = useSelector((state) => state.leaderboardGroupsState?.groupLeaderboards ?? {});

    // Measure container to compute dynamic list max height
    const [containerHeight, setContainerHeight] = useState(null);
    // pill ~44px + marginBottom 12 + percentile card ~110px + marginBottom 10 + padding top 12
    const ABOVE_LIST_HEIGHT = 44 + 12 + 110 + 10 + 12;
    const BOTTOM_PADDING = 50;
    const listMaxHeight = containerHeight != null
        ? containerHeight - ABOVE_LIST_HEIGHT - BOTTOM_PADDING
        : null;

    // Scope: 'global' or a groupId string
    const [selectedScope, setSelectedScope] = useState('global');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Create group modal
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // Leaderboard name entry
    const [nameInput, setNameInput] = useState('');
    const [nameError, setNameError] = useState('');
    const [nameSaving, setNameSaving] = useState(false);

    useEffect(() => {
        dispatch(fetchLeaderboard(level, category, auth));
    }, [level, category]);

    // Fetch group leaderboard when scope switches to a group
    useEffect(() => {
        if (selectedScope === 'global') return;
        const cached = groupLeaderboards[selectedScope]?.[level]?.[category];
        if (!cached) {
            dispatch(fetchGroupLeaderboard(selectedScope, level, category, auth));
        }
    }, [selectedScope, level, category]);

    const handleSaveName = async () => {
        const trimmed = nameInput.trim();
        if (!/^[a-zA-Z ]{1,20}$/.test(trimmed)) {
            setNameError('1–20 characters, letters and spaces only.');
            return;
        }
        setNameError('');
        setNameSaving(true);
        try {
            await dispatch(saveLeaderboardName(trimmed, auth));
        } catch (e) {
            setNameError(e?.response?.data || 'Something went wrong. Please try again.');
        } finally {
            setNameSaving(false);
        }
    };

    const handleCreateGroup = async () => {
        const trimmed = newGroupName.trim();
        if (!trimmed || trimmed.length > 30) {
            setCreateError('Name must be 1–30 characters.');
            return;
        }
        setCreateError('');
        setCreateLoading(true);
        try {
            const group = await dispatch(createLeaderboardGroup(trimmed, auth));
            setCreateModalVisible(false);
            setNewGroupName('');
            if (group?._id) setSelectedScope(group._id);
        } catch (e) {
            setCreateError(e?.response?.data || 'Could not create group. Try again.');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleGroupActions = (group) => {
        const isCreator = group.createdBy === currentUserId;
        const options = [
            {
                text: 'Invite Friends',
                onPress: () => {
                    const url = `https://wordladderpuzzlegame.com/join/${group._id}`;
                    Share.share({ message: `Join my Word Ladder leaderboard group "${group.name}"!\n${url}` });
                },
            },
            isCreator ? {
                text: 'Rename Group',
                onPress: () => {
                    Alert.prompt(
                        'Rename Group',
                        'Enter a new name (1–30 characters):',
                        async (newName) => {
                            if (!newName?.trim()) return;
                            try {
                                await dispatch(renameLeaderboardGroup(group._id, newName.trim(), auth));
                            } catch (e) {
                                Alert.alert('Error', 'Could not rename the group.');
                            }
                        },
                        'plain-text',
                        group.name
                    );
                },
            } : null,
            {
                text: 'Leave Group',
                style: 'destructive',
                onPress: () => {
                    Alert.alert(
                        'Leave Group',
                        `Are you sure you want to leave "${group.name}"?`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Leave', style: 'destructive',
                                onPress: async () => {
                                    await dispatch(leaveLeaderboardGroup(group._id, auth));
                                    setSelectedScope('global');
                                },
                            },
                        ]
                    );
                },
            },
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
        ].filter(Boolean);

        Alert.alert(group.name, `${group.members.length} member${group.members.length !== 1 ? 's' : ''}`, options);
    };

    const bgColor = levelColorScheme[level.charAt(0).toUpperCase() + level.slice(1)];

    // Require leaderboard name before showing any leaderboard
    if (currentUser && !currentUser.leaderboardName) {
        return (
            <View style={[styles.nameEntryScreen, { backgroundColor: bgColor }]}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Choose your display name</Text>
                    <Text style={styles.modalSubtitle}>This is how you'll appear on leaderboards. Letters and spaces only, max 20 characters.</Text>
                    <TextInput
                        style={styles.nameInput}
                        value={nameInput}
                        onChangeText={t => {
                            const filtered = t.replace(/[^a-zA-Z ]/g, '');
                            setNameError(filtered !== t ? 'Letters and spaces only.' : '');
                            setNameInput(filtered);
                        }}
                        placeholder="e.g. Word Wizard"
                        placeholderTextColor="#999"
                        maxLength={20}
                        autoCapitalize="words"
                        autoCorrect={false}
                    />
                    {nameError ? <Text style={styles.nameError}>{nameError}</Text> : null}
                    <TouchableOpacity
                        style={[styles.saveButton, nameSaving && styles.saveButtonDisabled]}
                        onPress={handleSaveName}
                        disabled={nameSaving}
                    >
                        <Text style={styles.saveButtonText}>{nameSaving ? 'Saving…' : 'Save Name'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Resolve active data
    const isGroup = selectedScope !== 'global';
    const activeGroup = groups.find(g => g._id === selectedScope);
    const activeData = isGroup
        ? groupLeaderboards[selectedScope]?.[level]?.[category]
        : leaderboardData;

    const selectedScopeName = isGroup ? (activeGroup?.name ?? '…') : 'Global';

    if (!activeData && !isGroup) {
        return <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}><ActivityIndicator size="large" color="#555" /></View>;
    }

    const CATEGORY_HEADINGS = {
        totalScore:    'Your Score',
        averageScore:  'Your Average Score',
        currentStreak: 'Your Current Streak',
        longestStreak: 'Your Best Streak',
        totalSolved:   "Puzzles You've Completed",
    };

    const { top10: entries = [], total = 0, userRank, percentileAhead, userScore, userDisplayName, groupName } = activeData || {};
    const displayEntries = isGroup ? entries : entries.slice(0, 5);
    const listTitle = isGroup ? (groupName || activeGroup?.name || 'Group') : 'Top 5';
    const percentileLabel = isGroup ? 'of group members' : 'of all players';

    return (
        <>
            <View style={[styles.container, { backgroundColor: bgColor }]} onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}>

                {/* ── Scope dropdown ── */}
                <TouchableOpacity style={styles.scopeDropdown} onPress={() => setDropdownOpen(true)} activeOpacity={0.8}>
                    <Ionicons name={isGroup ? 'people' : 'globe-outline'} size={16} color="#FFD60A" style={{ marginRight: 8 }} />
                    <Text style={styles.scopeDropdownLabel} numberOfLines={1}>{selectedScopeName}</Text>
                    <Ionicons name="chevron-down" size={15} color="#FFD60A" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                {/* Loading spinner for group leaderboard */}
                {isGroup && !activeData ? (
                    <View style={{ marginTop: 40 }}>
                        <ActivityIndicator size="large" color="#555" />
                    </View>
                ) : (
                    <>
                        {/* Score + percentile card */}
                        {percentileAhead !== null ? (
                            <Animatable.View animation="bounceIn" duration={700} delay={100} style={styles.percentileCard}>
                                <View>
                                    <Text style={styles.scoreHeading}>{CATEGORY_HEADINGS[category]}</Text>
                                    <Text style={styles.scoreDisplay} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{formatValue(category, userScore)}</Text>
                                </View>
                                <View style={styles.percentileRight}>
                                    <Text style={styles.percentileLine}>Better than</Text>
                                    <Text style={styles.percentileHighlight}>{percentileAhead}%</Text>
                                    <Text style={styles.percentileSub}>{percentileLabel}</Text>
                                </View>
                            </Animatable.View>
                        ) : (
                            <Animatable.View animation="fadeIn" duration={500} style={styles.percentileCard}>
                                <Text style={styles.noDataText}>
                                    {category === 'averageScore'
                                        ? 'Complete 7 puzzles to appear here'
                                        : 'Complete a puzzle to appear here'}
                                </Text>
                            </Animatable.View>
                        )}

                        <LeaderboardEntries
                            entries={displayEntries}
                            currentUserId={currentUserId}
                            currentUser={currentUser}
                            category={category}
                            listTitle={listTitle}
                            showEllipsis={true}
                            isGroup={isGroup}
                            userRank={userRank}
                            userScore={userScore}
                            userDisplayName={userDisplayName}
                            maxHeight={listMaxHeight}
                        />
                    </>
                )}
            </View>

            {/* ── Scope dropdown modal ── */}
            <Modal visible={dropdownOpen} transparent animationType="fade" onRequestClose={() => setDropdownOpen(false)}>
                <TouchableOpacity style={styles.dropdownOverlay} onPress={() => setDropdownOpen(false)} activeOpacity={1}>
                    <View style={styles.dropdownMenu}>
                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => { setSelectedScope('global'); setDropdownOpen(false); }}
                        >
                            <Ionicons name="globe-outline" size={18} color="#555" style={{ marginRight: 10 }} />
                            <Text style={styles.dropdownItemText}>Global</Text>
                            {selectedScope === 'global' && <Ionicons name="checkmark" size={18} color="#007AFF" style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>

                        {groups.length > 0 && <View style={styles.dropdownDivider} />}

                        {groups.length > 0 && (
                            <ScrollView style={{ maxHeight: 240 }} bounces={false} showsVerticalScrollIndicator={groups.length > 4}>
                                {groups.map(g => (
                                    <TouchableOpacity
                                        key={g._id}
                                        style={styles.dropdownItem}
                                        onPress={() => { setSelectedScope(g._id); setDropdownOpen(false); }}
                                    >
                                        <Ionicons name="people-outline" size={18} color="#555" style={{ marginRight: 10 }} />
                                        <Text style={styles.dropdownItemText} numberOfLines={1}>{g.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
                                            {selectedScope === g._id && <Ionicons name="checkmark" size={18} color="#007AFF" style={{ marginRight: 8 }} />}
                                            <TouchableOpacity
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                onPress={() => { setDropdownOpen(false); handleGroupActions(g); }}
                                            >
                                                <Ionicons name="ellipsis-horizontal" size={18} color="#bbb" />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.dropdownDivider} />

                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => { setDropdownOpen(false); setCreateModalVisible(true); }}
                        >
                            <Ionicons name="add-circle-outline" size={18} color="#007AFF" style={{ marginRight: 10 }} />
                            <Text style={[styles.dropdownItemText, { color: '#007AFF' }]}>Create New Group</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Create group modal ── */}
            <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
                <TouchableOpacity style={styles.dropdownOverlay} onPress={() => setCreateModalVisible(false)} activeOpacity={1}>
                    <View style={[styles.dropdownMenu, { padding: 20 }]} onStartShouldSetResponder={() => true}>
                        <Text style={styles.createGroupTitle}>Create a Leaderboard Group</Text>
                        <Text style={styles.createGroupSub}>Give your group a name. Share the invite link with friends after creating.</Text>
                        <TextInput
                            style={styles.nameInput}
                            value={newGroupName}
                            onChangeText={t => { setNewGroupName(t); setCreateError(''); }}
                            placeholder="e.g. Family, Work, School"
                            placeholderTextColor="#999"
                            maxLength={30}
                            autoCapitalize="words"
                            autoCorrect={false}
                            autoFocus
                        />
                        {createError ? <Text style={styles.nameError}>{createError}</Text> : null}
                        <TouchableOpacity
                            style={[styles.saveButton, createLoading && styles.saveButtonDisabled]}
                            onPress={handleCreateGroup}
                            disabled={createLoading}
                        >
                            <Text style={styles.saveButtonText}>{createLoading ? 'Creating…' : 'Create Group'}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 50,
        paddingHorizontal: 16,
    },

    // ── Scope dropdown ──
    scopeDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3A3A3C',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 12,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
        maxWidth: '80%',
    },
    scopeDropdownLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        flexShrink: 1,
    },
    dropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dropdownMenu: {
        backgroundColor: '#fff',
        borderRadius: 18,
        width: '100%',
        maxWidth: 340,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#111',
        fontWeight: '500',
        flexShrink: 1,
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 12,
    },

    // ── Create group modal ──
    createGroupTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111',
        textAlign: 'center',
        marginBottom: 6,
    },
    createGroupSub: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 14,
        lineHeight: 18,
    },

    // ── Percentile card ──
    percentileCard: {
        maxHeight: 140,
        backgroundColor: '#3A3A3C',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        width: '100%',
    },
    percentileRight: {
        alignItems: 'center',
    },
    scoreHeading: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E0E0E0',
        marginBottom: 4,
    },
    scoreDisplay: {
        fontSize: 30,
        fontWeight: '900',
        color: '#FFD60A',
    },
    percentileLine: {
        fontSize: 13,
        color: '#E0E0E0',
        textAlign: 'center',
        fontWeight: '600',
    },
    percentileHighlight: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFD60A',
    },
    percentileSub: {
        fontSize: 13,
        color: '#E0E0E0',
        textAlign: 'center',
        fontWeight: '600',
    },
    noDataText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },

    // ── Leaderboard list ──
    listContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
    },
    listTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    rowDivider: {
        height: 1,
        backgroundColor: '#D0D0D0',
        marginHorizontal: 4,
    },
    rowHighlighted: {
        backgroundColor: '#FFF9E6',
        borderWidth: 1.5,
        borderColor: '#FFD700',
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#999',
        width: 28,
        textAlign: 'center',
    },
    medalText: {
        fontSize: 22,
        marginLeft: 8,
    },
    scoreText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    scoreHighlighted: {
        color: '#B8860B',
    },
    youBadge: {
        backgroundColor: '#FFD700',
        borderRadius: 8,
        paddingVertical: 3,
        paddingHorizontal: 8,
    },
    youBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#7A5C00',
    },
    emptyText: {
        textAlign: 'center',
        color: '#aaa',
        fontSize: 14,
        paddingVertical: 16,
    },
    ellipsisRow: {
        alignItems: 'center',
        paddingVertical: 6,
    },
    ellipsisText: {
        fontSize: 14,
        color: '#999',
        letterSpacing: 6,
    },
    nameScoreCol: {
        flex: 1,
        marginLeft: 8,
        justifyContent: 'center',
    },
    displayName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 1,
    },
    displayNameHighlighted: {
        color: '#B8860B',
    },

    // ── Name entry ──
    nameEntryScreen: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111',
        textAlign: 'center',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 14,
        lineHeight: 18,
    },
    nameInput: {
        borderWidth: 1.5,
        borderColor: '#DDD',
        borderRadius: 12,
        paddingVertical: 9,
        paddingHorizontal: 14,
        fontSize: 16,
        color: '#111',
        marginBottom: 6,
    },
    nameError: {
        fontSize: 13,
        color: '#E53935',
        marginBottom: 12,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: '#FFD60A',
        borderRadius: 14,
        paddingVertical: 11,
        alignItems: 'center',
        marginTop: 6,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#333',
    },
});
