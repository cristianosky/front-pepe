import { useState, useLayoutEffect } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { COLORS } from '../../theme';

export default function useAdminMenu(navigation) {
  const [menuOpen, setMenuOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ marginLeft: 14 }}>
          <Text style={{ fontSize: 24, color: COLORS.white }}>☰</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return { menuOpen, closeMenu: () => setMenuOpen(false) };
}
