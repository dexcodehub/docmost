import { useEffect, useMemo, useRef, useState } from "react";
import { ActionIcon, Button, Group, Popover } from "@mantine/core";
import type { ActionIconProps } from "@mantine/core";
import { useDisclosure, useClickOutside, useWindowEvent } from "@mantine/hooks";
import { IconMoodSmile } from "@tabler/icons-react";

interface EmojiPickerProps {
  value?: string | null;
  onChange?: (emoji: string | null) => void;
  // Alias to fit existing usage in some components
  onEmojiSelect?: (emoji: any) => void;
  disabled?: boolean;
  // Optional UI customizations
  icon?: React.ReactNode; // shown when no value selected
  readOnly?: boolean; // disable interactions
  removeEmojiAction?: () => void; // callback when removing
  actionIconProps?: Partial<ActionIconProps>; // customize trigger icon props
}

export function EmojiPicker({
  value,
  onChange,
  onEmojiSelect,
  disabled,
  icon,
  readOnly,
  removeEmojiAction,
  actionIconProps,
}: EmojiPickerProps) {
  const [opened, { open, close, toggle }] = useDisclosure(false);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const clickOutsideRef = useClickOutside(() => close());

  // Use a non-button trigger to avoid nested button warnings in button contexts
  const Trigger = (
    <ActionIcon
      component="div"
      ref={targetRef}
      onClick={disabled || readOnly ? undefined : toggle}
      size={actionIconProps?.size ?? "sm"}
      variant={actionIconProps?.variant ?? "light"}
      aria-label="选择表情"
      role="button"
      tabIndex={0}
      data-testid="emoji-trigger"
      {...actionIconProps}
    >
      {value ? (
        <span style={{ fontSize: 18, lineHeight: 1 }}>{value}</span>
      ) : (
        icon ? icon : <IconMoodSmile size={16} />
      )}
    </ActionIcon>
  );

  useWindowEvent("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  return (
    <Popover opened={opened} onChange={(o) => (o ? open() : close())} withArrow>
      <Popover.Target>{Trigger}</Popover.Target>
      <Popover.Dropdown ref={clickOutsideRef} style={{ padding: 8 }}>
        <div style={{ width: 276 }}>
          <PickerAsync
            onEmojiSelect={(emoji: any) => {
              const native = emoji?.native || emoji?.shortcodes || emoji || "";
              const val = native || null;
              onChange?.(val);
              onEmojiSelect?.(val);
              close();
            }}
          />
        </div>
        <Group justify="space-between" mt="xs">
          <Button
            variant="default"
            size="xs"
            onClick={() => {
              onChange?.(null);
              removeEmojiAction?.();
              close();
            }}
          >
            移除
          </Button>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
}

// Async loader component to render emoji-mart Picker default export with data
function PickerAsync(props: any) {
  const [PickerComp, setPickerComp] = useState<any>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      import("@emoji-mart/react").then((m) => m.default),
      import("@emoji-mart/data").then((m) => m.default),
    ]).then(([Comp, dataset]) => {
      if (!mounted) return;
      setPickerComp(() => Comp);
      setData(dataset);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!PickerComp || !data) return null;
  const Picker = PickerComp;
  return <Picker data={data} {...props} />;
}

export default EmojiPicker;
