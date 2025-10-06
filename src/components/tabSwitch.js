import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';

const ACTIVE_COLOR = '#0B6B57';  
const BORDER_COLOR = '#CFCFCF';   
const RADIUS = 10;                
const HEIGHT = 40;              

export default function TabSwitch({
  options = [
    { label: 'Consulta', value: 'consulta' },
    { label: 'Benefício', value: 'beneficio' },
  ],
  selected,
  onSelect,
}) {
  return (
    <View style={styles.wrap}>
      {options.map((opt, idx) => {
        const ativo = selected === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect?.(opt.value)}
            style={[
              styles.tabBase,
              idx === 0 && { marginRight: 6 },
              ativo ? styles.tabAtivo : styles.tabInativo,
            ]}
          >
            <Text style={[styles.textoBase, ativo ? styles.textoAtivo : styles.textoInativo]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'start',
    justifyContent: 'start',
  },
  tabBase: {
    minWidth: 110,
    marginTop: 20,
    marginBottom: 20, 
    height: HEIGHT,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10, 
  },
  tabAtivo: {
    backgroundColor: ACTIVE_COLOR,
    borderColor: ACTIVE_COLOR,
  },
  tabInativo: {
    backgroundColor: '#FFFFFF',
  },
  textoBase: {
    fontSize: 16,
    fontWeight: '600',
  },
  textoAtivo: {
    color: '#FFFFFF',
  },
  textoInativo: {
    color: '#000000',
  },
});
