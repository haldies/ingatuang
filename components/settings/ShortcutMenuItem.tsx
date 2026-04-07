import React from 'react';
import { Platform } from 'react-native';
import ShortcutMenuItemIos from '@/components/settings/ShortcutMenuItem.ios';
import ShortcutMenuItemAndroid from '@/components/settings/ShortcutMenuItem.android';

/**
 * Unified Shortcut Menu Item Export with Strong Typing
 * This explicit cast helps TypeScript resolve the module error.
 */
const ShortcutMenuItem: React.FC = Platform.OS === 'ios' 
  ? ShortcutMenuItemIos 
  : ShortcutMenuItemAndroid;

export default ShortcutMenuItem;
