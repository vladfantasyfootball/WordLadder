import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { levelColorScheme, levelButtonColorScheme } from '../../redux/constants/colorScheme';
import * as Haptics from 'expo-haptics';

const ROW_HEIGHT    = 48;
const ROW_MARGIN    = 6;
const KEY_H_MARGIN  = 2;   // marginHorizontal on each key
const ACTION_WIDTH  = 48;  // fixed right-column width
const KB_PADDING    = 4;   // keyboard paddingHorizontal

const LETTER_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],  // 10 keys — defines key width
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],        // 9 keys — left-aligned gap at end
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],                   // 7 keys — left-aligned gap at end
];

const CustomKeyboard = ({ onKeyPress, onSubmit, disabled, submitDisabled, levelColor }) => {
  const { width: screenWidth } = useWindowDimensions();

  // Calculate a fixed key size so every letter key is identical.
  // Total horizontal space taken by margins across 10 keys = 10 * 2 * KEY_H_MARGIN
  const keyWidth = Math.floor(
    (screenWidth - ACTION_WIDTH - KB_PADDING * 2 - 10 * KEY_H_MARGIN * 2) / 10
  );

  // Map the pastel level color to its darker button variant for contrast
  const levelKey = Object.keys(levelColorScheme).find((k) => levelColorScheme[k] === levelColor);
  const submitBg = (levelKey ? levelButtonColorScheme[levelKey] : null) || levelColor || '#6AAA64';

  const handlePress = (key) => {
    if (disabled) return;
    if (key === 'DELETE') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onKeyPress('BACKSPACE');
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onKeyPress(key.toLowerCase());
    }
  };

  const handleSubmit = () => {
    if (disabled || submitDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit();
  };

  return (
    <View style={styles.keyboard}>
      <View style={styles.layout}>

        {/* ── Left: letter rows ─────────────────────────────────────── */}
        <View>
          {LETTER_ROWS.map((row, i) => (
            <View key={i} style={styles.letterRow}>
              {row.map((letter) => (
                <TouchableOpacity
                  key={letter}
                  style={[
                    styles.letterKey,
                    { width: keyWidth, height: ROW_HEIGHT },
                    disabled && styles.disabledKey,
                  ]}
                  onPress={() => handlePress(letter)}
                  disabled={disabled}
                >
                  <Text style={styles.keyText}>{letter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* ── Right: action column ──────────────────────────────────── */}
        <View style={styles.actionColumn}>
          {/* Empty cell — aligns with row 1 */}
          <View style={styles.actionSpacer} />

          {/* Back — aligns with row 2 */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn, disabled && styles.disabledKey]}
            onPress={() => handlePress('DELETE')}
            disabled={disabled}
          >
            <MaterialCommunityIcons name="backspace-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Submit — aligns with row 3 */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: submitBg },
              (disabled || submitDisabled) && styles.disabledKey,
            ]}
            onPress={handleSubmit}
            disabled={disabled || submitDisabled}
          >
            <MaterialCommunityIcons name="check-bold" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    backgroundColor: '#D3D6DA',
    paddingVertical: 8,
    paddingHorizontal: KB_PADDING,
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  letterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: ROW_MARGIN,
  },
  letterKey: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginHorizontal: KEY_H_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  actionColumn: {
    width: ACTION_WIDTH,
    paddingLeft: 4,
  },
  actionSpacer: {
    height: ROW_HEIGHT + ROW_MARGIN,  // same as one row
  },
  actionBtn: {
    height: ROW_HEIGHT,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ROW_MARGIN,
  },
  deleteBtn: {
    backgroundColor: '#818384',
  },
  disabledKey: {
    opacity: 0.5,
  },
  keyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

export default CustomKeyboard;

