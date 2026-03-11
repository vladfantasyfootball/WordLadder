import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CustomKeyboard = ({ onKeyPress, onSubmit, disabled, submitDisabled, levelColor }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['SUBMIT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE']
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
          (disabled || (isSubmit && submitDisabled)) && styles.disabledKey
        ]}
        onPress={() => handleKeyPress(key)}
        disabled={disabled || (isSubmit && submitDisabled)}
      >
        <Text style={[
          styles.keyText,
          isDelete && styles.specialKeyText,
          isSubmit && styles.submitKeyText
        ]}>
          {key}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.keyboard}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map(renderKey)}
        </View>
      ))}
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
    marginBottom: 6,
  },
  key: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginHorizontal: 2,
    minWidth: 32,
    height: 48,
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
