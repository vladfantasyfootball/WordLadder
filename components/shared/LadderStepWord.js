import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const ladderWordStyleScheme = {
    'One': '#CCE7F4',
    'Two': '#E5D8FF',
    'Three': '#FFCF70',
}

const LadderStepWord = ({ word, level, size, fontSize }) => {
    return (
        <FlatList
            data={[...word].map((letter, index) => {
                return {
                    key: letter,
                    id: `${letter + index}`
                }
            })}
            horizontal={true}
            renderItem={({ item }) => {
                return (
                    <View style={[styles.letterContainer, { backgroundColor: `${ladderWordStyleScheme[level] || 'white'}`, width: size, height: size }]}>
                        <Text style={[styles.item, { fontSize: fontSize, lineHeight: fontSize, includeFontPadding: false }]}>{item.key}</Text>
                    </View>
                )
            }}
            keyExtractor={item => item.id}
        />
    );
}

const styles = StyleSheet.create({
    letterContainer: {
        borderWidth: 4,
        borderColor: 'black',
        borderStyle: 'solid',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 2,
    },
    item: {
        textTransform: 'uppercase',
        color: 'black',
    },
});

export default LadderStepWord;