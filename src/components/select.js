import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native';

const CustomSelect = ({ data, placeholder, onValueChange, selectedValue, containerStyle }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = data.find(item => item.value === selectedValue)?.label;

  const handleSelect = (item) => {
    onValueChange(item.value);
    setIsOpen(false);
  };

  return (
    // O containerStyle e o zIndex são importantes para que um dropdown não fique por baixo do outro
    <View style={[styles.container, containerStyle, { zIndex: isOpen ? 100 : 1 }]}>
      <Pressable style={styles.selectButton} onPress={() => setIsOpen(!isOpen)}>
        <Text style={[styles.selectButtonText, !selectedLabel && styles.placeholderText]}>
          {selectedLabel || placeholder}
        </Text>
        <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
      </Pressable>

      {isOpen && (
        <View style={styles.optionsContainer}>
          <FlatList
            data={data}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <Pressable style={styles.option} onPress={() => handleSelect(item)}>
                <Text style={styles.optionText}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative', // Essencial para o posicionamento absoluto da lista
    width: '100%',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  arrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  // ✨ Nova estilização para a lista dropdown
  optionsContainer: {
    position: 'absolute',
    top: '100%', // Posiciona a lista logo abaixo do botão
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 4, // Pequeno espaço entre o input e a lista
    maxHeight: 200, // Altura máxima antes de habilitar o scroll
    elevation: 5, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  option: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
  },
});

export default CustomSelect;