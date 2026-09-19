import { Drawer } from 'expo-router/drawer';

import { MenuDrawerContent } from '@/components/menu/menu-drawer-content';
import { AppColors } from '@/constants/app-colors';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: AppColors.overlay,
        drawerStyle: { width: '82%', backgroundColor: AppColors.background },
        swipeEdgeWidth: 40,
      }}
      drawerContent={(props) => <MenuDrawerContent {...props} />}>
      <Drawer.Screen name="(home-tabs)" />
    </Drawer>
  );
}
