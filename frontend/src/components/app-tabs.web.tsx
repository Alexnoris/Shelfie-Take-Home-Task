import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabListProps,
} from 'expo-router/ui';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" />
        </CustomTabList>
      </TabList>
      <TabSlot style={{ flex: 1 }} />
    </Tabs>
  );
}

export function CustomTabList(props: TabListProps) {
  const { children, style, ...rest } = props;

  return (
    <View {...rest} style={[style, styles.tabListContainer]}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Shelfie Take Home Task
        </ThemedText>
      </ThemedView>
      <View style={styles.hiddenTrigger}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    textAlign: 'center',
  },
  hiddenTrigger: {
    display: 'none',
  },
});
