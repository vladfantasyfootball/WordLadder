import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CustomKeyboard = ({ onKeyPress, onSubmit, disabled, submitDisabled, levelColor }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'DELETE'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'SUBMIT'],
  ];

  const handleKeyPress = (key) => {
    if (disabled) return;
    
    if (key === 'DELETE') {
      onKeyPress('BACKSPACE');
    } else if (key === 'SUBMIT') {
      if (!submitDisabled) {
        onSubmit();
      }
    } else {
      onKeyPress(key.toLowerCase());
    }
  };

  const renderKey = (key) => {
    const isSpecial = key === 'SUBMIT' || key === 'DELETE';
    const isSubmit = key === 'SUBMIT';
    const isDelete = key === 'DELETE';
    
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.key,
          isSpecial && styles.specialKey,
          isSubmit && { backgroundColor: levelColor || '#6AAA64' },
          isDelete && styles.deleteKey,
          (disabled || (isSubmit && submitDisabled)) && styles.disabledKey,
        ]}
        onPress={() => handleKeyPress(key)}
        disabled={disabled || (isSubmit && submitDisabled)}
      >
        {isDelete ? (
          <MaterialCommunityIcons name="backspace-outline" size={22} color="#FFFFFF" />
        ) : (
          <Text style={[
            styles.keyText,
            isSubmit && styles.submitKeyText
          ]}>
            {key}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.keyboard}>
      {rows.map((row, rowIndex) => {
        const actionKey = row.find(k => k === 'DELETE' || k === 'SUBMIT');
        const letters = actionKey ? row.filter(k => k !== actionKey) : row;

        return (
          <View key={rowIndex} style={[styles.row, !actionKey && styles.rowLeft]}>
            {actionKey ? (
              <>
                <View style={styles.letterGroup}>
                  {letters.map(renderKey)}
                </View>
                {renderKey(actionKey)}
              </>
            ) : (
              letters.map(renderKey)
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    backgroundColor: '#D3D6DA',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  letterGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  key: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginHorizontal: 2,
    minWidth: 38,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  specialKey: {
    backgroundColor: '#818384',
    minWidth: 60,
  },
  deleteKey: {
    backgroundColor: '#818384',
    minWidth: 42,
    paddingHorizontal: 4,
  },
  disabledKey: {
    opacity: 0.5,
  },
  keyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  specialKeyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitKeyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
});

export default CustomKeyboard;
