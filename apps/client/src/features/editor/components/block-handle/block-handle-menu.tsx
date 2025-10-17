import React, { useEffect, useRef, useState } from "react";
import { ActionIcon, Checkbox, Group, Popover, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Editor } from "@tiptap/react";
import {
  IconTrash,
  IconCopy,
  IconLink,
  IconChevronRight,
} from "@tabler/icons-react";
import classes from "./block-handle-menu.module.css";

interface BlockHandleMenuProps {
  editor: Editor | null;
}

export default function BlockHandleMenu({ editor }: BlockHandleMenuProps) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const clickedPosRef = useRef<number | null>(null);
  const [colorChecked, setColorChecked] = useState<boolean>(false);
  // add a timer to distinguish click vs drag on draggable handles
  const openTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor) return;

    let isDragging = false;

    // Resolve the ProseMirror position for a drag-handle element more robustly.
    // Prefer DOM-based resolution and fall back to coord-based lookup with a wider Y search radius.
    const resolvePosForHandle = (handleEl: HTMLElement): number | null => {
      const view = editor.view;
      try {
        const domPos = (view as any).posAtDOM?.(handleEl, 0);
        if (typeof domPos === "number" && domPos >= 0) {
          return domPos;
        }
      } catch (_e) {
        // ignore and fallback to coords
      }
      const rect = handleEl.getBoundingClientRect();
      const containerRect = (view.dom as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const clampedLeft = Math.min(Math.max(containerRect.left + 4, cx), containerRect.right - 4);
      const clampedTop = Math.min(Math.max(containerRect.top + 4, cy), containerRect.bottom - 4);
      let posAtCoords = view.posAtCoords({ left: clampedLeft, top: clampedTop });
      if (!posAtCoords?.pos) {
        const offsets = [-18, -12, -6, -3, 0, 3, 6, 12, 18];
        for (const dy of offsets) {
          posAtCoords = view.posAtCoords({ left: clampedLeft, top: clampedTop + dy }) || posAtCoords;
          if (posAtCoords?.pos) break;
        }
      }
      return posAtCoords?.pos ?? null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rawTarget = e.target as HTMLElement | null;
      if (!rawTarget) return;
      const handleEl = (rawTarget.closest?.(".drag-handle") || rawTarget.closest?.("[data-drag-handle]")) as HTMLElement | null;
      if (!handleEl) return;
      // reset drag flag and schedule a delayed open; cancelled if drag starts
      isDragging = false;
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
      const rect = handleEl.getBoundingClientRect();
      const view = editor.view;
      const containerRect = (view.dom as HTMLElement).getBoundingClientRect();
      // clamp coords to inside the editor container to avoid null posAtCoords at top edge
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const clampedLeft = Math.min(Math.max(containerRect.left + 4, cx), containerRect.right - 4);
      const clampedTop = Math.min(Math.max(containerRect.top + 4, cy), containerRect.bottom - 4);
      openTimerRef.current = window.setTimeout(() => {
        if (isDragging) return;
        const resolvedPos = resolvePosForHandle(handleEl);
        if (resolvedPos == null) return;
        const $pos = view.state.doc.resolve(resolvedPos);
        const node = $pos.parent;
        if (!node) return;
        clickedPosRef.current = resolvedPos;
        const anchor = anchorRef.current;
        if (anchor) {
          anchor.style.left = `${Math.max(containerRect.left + 8, rect.left)}px`;
          anchor.style.top = `${clampedTop + 6}px`;
        }
        setOpened(true);
        e.preventDefault();
        e.stopPropagation();
        openTimerRef.current = null;
      }, 120);
    };

    const handleMouseUp = () => {
      // reset drag flag after releasing mouse to allow click open
      isDragging = false;
    };

    const handleDragStart = (e: DragEvent) => {
      const rawTarget = e.target as HTMLElement | null;
      if (!rawTarget) return;
      const handleEl = (rawTarget.closest?.(".drag-handle") || rawTarget.closest?.("[data-drag-handle]")) as HTMLElement | null;
      if (!handleEl) return;
      isDragging = true;
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rawTarget = e.target as HTMLElement | null;
      if (!rawTarget) return;
      const handleEl = (rawTarget.closest?.(".drag-handle") || rawTarget.closest?.("[data-drag-handle]")) as HTMLElement | null;
      if (!handleEl) return;
      // if a delayed open is already scheduled, let it handle
      if (openTimerRef.current) return;
      // ignore synthetic click immediately following a drag
      if (isDragging) {
        isDragging = false;
        return;
      }

      const rect = handleEl.getBoundingClientRect();

      // Map handle position to ProseMirror coords, clamped to editor container
      const view = editor.view;
      const containerRect = (view.dom as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const clampedLeft = Math.min(Math.max(containerRect.left + 4, cx), containerRect.right - 4);
      const clampedTop = Math.min(Math.max(containerRect.top + 4, cy), containerRect.bottom - 4);
      const resolvedPos = resolvePosForHandle(handleEl);
      if (resolvedPos == null) return;

      // Resolve parent block node at position
      const $pos = view.state.doc.resolve(resolvedPos);
      const node = $pos.parent;

      // 允许所有块类型触发弹框（标题、段落、列表、表格单元等）
      if (!node) return;

      clickedPosRef.current = resolvedPos;

      // Position fake anchor for Popover
      const anchor = anchorRef.current;
      if (anchor) {
        anchor.style.left = `${Math.max(containerRect.left + 8, rect.left)}px`;
        anchor.style.top = `${clampedTop + 6}px`;
      }
      setOpened(true);
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("click", handleClick, true);
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
    };
  }, [editor]);

  const getBlockRange = () => {
    if (!editor || clickedPosRef.current === null) return null;
    const view = editor.view;
    const $pos = view.state.doc.resolve(clickedPosRef.current);
    const depth = $pos.depth;
    const from = $pos.start(depth);
    const to = $pos.end(depth);
    return { from, to };
  };

  const handleDelete = () => {
    const range = getBlockRange();
    if (!range) return;
    editor?.chain().focus().deleteRange(range).run();
    setOpened(false);
  };

  const handleCopy = async () => {
    const range = getBlockRange();
    if (!range) return;
    const { state } = editor!;
    const text = state.doc.textBetween(range.from, range.to, "\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch (_err) {
      /* noop */
    }
    setOpened(false);
  };

  const handlePasteBlockLink = async () => {
    const range = getBlockRange();
    if (!range) return;
    const link = `#block-${range.from}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch (_err) {
      /* noop */
    }
    setOpened(false);
  };

  // 打开斜杠命令菜单以转换当前块类型
  const openSlashTransform = () => {
    const range = getBlockRange();
    if (!range) return;
    // 将光标定位到当前块内部（避免选择整个块导致 setNode 失败）
    const pos = Math.min(range.to - 1, range.from + 1);
    // 先直接聚焦视图，不改变 selection（避免 focus("start"/"end") 抢占选择导致跳到第一行）
    editor?.view.focus();
    // 折叠选择并插入"/"，触发 SlashCommand 的建议列表
    editor?.chain().setTextSelection({ from: pos, to: pos }).insertContent("/").run();
    setOpened(false);
  };

  const toggleColor = () => {
    const range = getBlockRange();
    if (!range) return;
    setColorChecked((prev) => !prev);
    editor?.chain().focus().setTextSelection({ from: range.from + 1, to: range.to - 1 }).run();
    if (!colorChecked) {
      // apply a subtle highlight to simulate color selection
      editor?.chain().focus().toggleHighlight({ color: "var(--mantine-color-blue-1)" }).run();
    } else {
      editor?.chain().focus().unsetHighlight().run();
    }
    setOpened(false);
  };

  return (
    <Popover opened={opened} withArrow shadow="md" position="right" onChange={setOpened}>
      <Popover.Target>
        <div ref={anchorRef} className={classes.anchor} />
      </Popover.Target>
      <Popover.Dropdown className={classes.menuRoot} style={{ userSelect: "none" }}>
        <Group className={classes.item} gap="xs" onClick={handleDelete}>
          <ActionIcon variant="transparent" color="gray">
            <IconTrash size={18} />
          </ActionIcon>
          <Text className={classes.label}>{t("Delete") || "删除"}</Text>
        </Group>
        <Group className={classes.item} gap="xs" onClick={handleCopy}>
          <ActionIcon variant="transparent" color="gray">
            <IconCopy size={18} />
          </ActionIcon>
          <Text className={classes.label}>{t("Copy") || "复制"}</Text>
        </Group>
        <Group className={classes.item} gap="xs" onClick={handlePasteBlockLink}>
          <ActionIcon variant="transparent" color="gray">
            <IconLink size={18} />
          </ActionIcon>
          <Text className={classes.label}>粘贴块链接</Text>
        </Group>
        <div className={classes.separator} />
        <Group className={classes.item} gap="xs" onClick={openSlashTransform}>
          <Text className={classes.label}>变成</Text>
          <IconChevronRight size={16} className={classes.rightArrow} />
        </Group>
        <div className={classes.separator} />
        <Group className={classes.item} gap="xs" onClick={toggleColor}>
          <Checkbox checked={colorChecked} onChange={() => setColorChecked(!colorChecked)} radius="sm" />
          <Text className={classes.label}>{t("Color") || "颜色"}</Text>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
}