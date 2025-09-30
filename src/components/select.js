import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';

// Sistema global para controlar qual select está aberto
let globalOpenSelectId = null;
const selectInstances = new Set();

const Select = ({ data, placeholder, onValueChange, selectedValue, containerStyle, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectId = useRef(Math.random().toString(36).substr(2, 9));

  const selectedLabel = data.find(item => item.value === selectedValue)?.label;

  // Registra esta instância do Select
  useEffect(() => {
    selectInstances.add({
      id: selectId.current,
      setIsOpen
    });

    return () => {
      selectInstances.forEach(instance => {
        if (instance.id === selectId.current) {
          selectInstances.delete(instance);
        }
      });
    };
  }, []);

  const handleToggle = () => {
    if (isOpen) {
      // Se está aberto, fecha
      setIsOpen(false);
      globalOpenSelectId = null;
    } else {
      // Fecha todos os outros selects
      selectInstances.forEach(instance => {
        if (instance.id !== selectId.current) {
          instance.setIsOpen(false);
        }
      });
      
      // Abre este select
      setIsOpen(true);
      globalOpenSelectId = selectId.current;
    }
  };

  const handleSelect = (item) => {
    onValueChange(item.value);
    setIsOpen(false);
    globalOpenSelectId = null;
  };

  // Fecha o select quando outro componente é tocado
  useEffect(() => {
    const checkAndClose = () => {
      if (isOpen && globalOpenSelectId !== selectId.current) {
        setIsOpen(false);
      }
    };

    const interval = setInterval(checkAndClose, 100);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <View style={[styles.container, containerStyle, { zIndex: isOpen ? 1000 : 1 }]}>
      {label ? (
        <Text style={styles.label}>
          {label}
        </Text>
      ) : null}

      <Pressable style={styles.selectButton} onPress={handleToggle}>
        <Text style={[styles.selectButtonText, !selectedLabel && styles.placeholderText]}>
          {selectedLabel || placeholder}
        </Text>
        <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
      </Pressable>

      {isOpen && (
        <View style={styles.optionsContainer}>
          <ScrollView nestedScrollEnabled={true}>
            {data.map((item) => (
              <Pressable
                key={item.value.toString()}
                style={styles.option}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#121212',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F7F7',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 8,
    paddingHorizontal: 16,
    width: '100%',
    height: 40,
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

  optionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
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

export default Select;