import React, { useEffect, useMemo, useState } from "react";
import { ActionIcon, Button, Grid, Group, Modal, ScrollArea, Text, Tooltip } from "@mantine/core";
import {
  IconHome,
  IconSearch,
  IconSettings,
  IconPlus,
  IconStar,
  IconBookmark,
  IconFolder,
  IconFileText,
  IconTag,
  IconHeart,
  IconRocket,
  IconPin,
  IconBook,
  IconCalendar,
  IconMessageCircle,
  IconCloud,
  IconUser,
} from "@tabler/icons-react";

export type IconName =
  | "home"
  | "search"
  | "settings"
  | "plus"
  | "star"
  | "bookmark"
  | "folder"
  | "file"
  | "tag"
  | "heart"
  | "rocket"
  | "pin"
  | "book"
  | "calendar"
  | "message"
  | "cloud"
  | "user";

export const ICON_OPTIONS: { name: IconName; label: string; Component: React.FC<any> }[] = [
  { name: "home", label: "Home", Component: IconHome },
  { name: "search", label: "Search", Component: IconSearch },
  { name: "settings", label: "Settings", Component: IconSettings },
  { name: "plus", label: "Plus", Component: IconPlus },
  { name: "star", label: "Star", Component: IconStar },
  { name: "bookmark", label: "Bookmark", Component: IconBookmark },
  { name: "folder", label: "Folder", Component: IconFolder },
  { name: "file", label: "File", Component: IconFileText },
  { name: "tag", label: "Tag", Component: IconTag },
  { name: "heart", label: "Heart", Component: IconHeart },
  { name: "rocket", label: "Rocket", Component: IconRocket },
  { name: "pin", label: "Pin", Component: IconPin },
  { name: "book", label: "Book", Component: IconBook },
  { name: "calendar", label: "Calendar", Component: IconCalendar },
  { name: "message", label: "Message", Component: IconMessageCircle },
  { name: "cloud", label: "Cloud", Component: IconCloud },
  { name: "user", label: "User", Component: IconUser },
];

export function getIconComponent(name: IconName): React.FC<any> {
  const found = ICON_OPTIONS.find((i) => i.name === name);
  return (found?.Component || IconHome) as React.FC<any>;
}

const COLOR_NAMES = [
  "gray",
  "blue",
  "cyan",
  "teal",
  "green",
  "yellow",
  "orange",
  "red",
  "pink",
  "violet",
];

function toCssColor(name: string) {
  return `var(--mantine-color-${name}-6)`;
}

interface IconPickerModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (iconName: IconName, color: string) => void;
  initialIcon?: IconName;
  initialColor?: string; // CSS color string
  title?: string;
}

export function IconPickerModal({ opened, onClose, onSubmit, initialIcon = "home", initialColor = toCssColor("gray"), title = "Pick icon" }: IconPickerModalProps) {
  const [iconName, setIconName] = useState<IconName>(initialIcon);
  const [color, setColor] = useState<string>(initialColor);

  useEffect(() => {
    if (opened) {
      setIconName(initialIcon);
      setColor(initialColor);
    }
  }, [opened, initialIcon, initialColor]);

  const SelectedIcon = useMemo(() => getIconComponent(iconName), [iconName]);

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered withOverlay>
      <Group justify="space-between" mb="sm">
        <Text size="sm" c="dimmed">Icon</Text>
        <Group>
          <SelectedIcon size={22} stroke={2} style={{ color }} />
          <Text size="sm">Preview</Text>
        </Group>
      </Group>
      <ScrollArea.Autosize mah={220} type="auto">
        <Grid gutter="xs">
          {ICON_OPTIONS.map(({ name, label, Component }) => (
            <Grid.Col key={name} span={3}>
              <Tooltip label={label} withArrow>
                <ActionIcon
                  variant={iconName === name ? "filled" : "default"}
                  color={iconName === name ? "blue" : "gray"}
                  aria-label={label}
                  onClick={() => setIconName(name)}
                >
                  <Component size={18} stroke={2} style={{ color }} />
                </ActionIcon>
              </Tooltip>
            </Grid.Col>
          ))}
        </Grid>
      </ScrollArea.Autosize>

      <Group mt="md" mb="sm">
        <Text size="sm" c="dimmed">Color</Text>
      </Group>
      <Group gap="xs" wrap="wrap">
        {COLOR_NAMES.map((c) => {
          const css = toCssColor(c);
          const active = css === color;
          return (
            <ActionIcon
              key={c}
              variant={active ? "filled" : "default"}
              color={active ? c : "gray"}
              onClick={() => setColor(css)}
              aria-label={c}
              style={{ width: 28, height: 28 }}
            >
              <SelectedIcon size={16} stroke={2} style={{ color: css }} />
            </ActionIcon>
          );
        })}
      </Group>

      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSubmit(iconName, color)}>Save</Button>
      </Group>
    </Modal>
  );
}