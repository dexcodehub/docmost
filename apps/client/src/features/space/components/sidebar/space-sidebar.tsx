import {
  ActionIcon,
  Group,
  Menu,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  IconArrowDown,
  IconDots,
  IconFileExport,
  IconHome,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import classes from "./space-sidebar.module.css";
import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { treeApiAtom } from "@/features/page/tree/atoms/tree-api-atom.ts";
import { Link, useLocation, useParams } from "react-router-dom";
import clsx from "clsx";
import { useDisclosure } from "@mantine/hooks";
import SpaceSettingsModal from "@/features/space/components/settings-modal.tsx";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { getSpaceUrl } from "@/lib/config.ts";
import SpaceTree from "@/features/page/tree/components/space-tree.tsx";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability.ts";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type.ts";
import PageImportModal from "@/features/page/components/page-import-modal.tsx";
import { useTranslation } from "react-i18next";
import { SwitchSpace } from "./switch-space";
import ExportModal from "@/components/common/export-modal";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import { searchSpotlight } from "@/features/search/constants";
import EmojiPicker from "@/components/ui/emoji-picker.tsx";

export function SpaceSidebar() {
  const { t } = useTranslation();
  const [tree] = useAtom(treeApiAtom);
  const location = useLocation();
  const [opened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);

  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);

  const spaceRules = space?.membership?.permissions;
  const spaceAbility = useSpaceAbility(spaceRules);

  type MenuKey = "overview" | "search" | "settings" | "newpage";
  const [emojiConfig, setEmojiConfig] = useState<Record<MenuKey, string | null>>(() => {
    try {
      const raw = localStorage.getItem("sidebarEmojiConfig");
      if (raw) return JSON.parse(raw) as Record<MenuKey, string | null>;
    } catch (_err) {
      /* noop */
    }
    return { overview: null, search: null, settings: null, newpage: null };
  });
  useEffect(() => {
    try {
      localStorage.setItem("sidebarEmojiConfig", JSON.stringify(emojiConfig));
    } catch (_err) {
      /* noop */
    }
  }, [emojiConfig]);

  const handleEmojiIconClick = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (!space) {
    return <></>;
  }

  function handleCreatePage() {
    tree?.create({ parentId: null, type: "internal", index: 0 });
  }

  return (
    <>
      <div className={classes.navbar}>
        <div
          className={classes.section}
          style={{
            border: "none",
            marginTop: 2,
            marginBottom: 3,
          }}
        >
          <SwitchSpace
            spaceName={space?.name}
            spaceSlug={space?.slug}
            spaceIcon={space?.logo}
          />
        </div>

        <div className={classes.section}>
          <div className={classes.menuItems}>
            <UnstyledButton
              component={Link}
              to={getSpaceUrl(spaceSlug)}
              className={clsx(
                classes.menu,
                location.pathname.toLowerCase() === getSpaceUrl(spaceSlug)
                  ? classes.activeButton
                  : "",
              )}
            >
              <div className={classes.menuItemInner}>
                <div onClick={handleEmojiIconClick} className={classes.emojiIcon}>
                   <EmojiPicker
                     onEmojiSelect={(emoji: any) =>
                       setEmojiConfig((prev) => ({
                         ...prev,
                         overview: emoji?.native || emoji?.emoji || emoji,
                       }))
                     }
                     icon={
                       emojiConfig.overview ? (
                         <Text size="md">{emojiConfig.overview}</Text>
                       ) : (
                         <IconHome size={18} className={classes.menuItemIcon} stroke={2} />
                       )
                     }
                     readOnly={false}
                     removeEmojiAction={() =>
                       setEmojiConfig((prev) => ({ ...prev, overview: null }))
                     }
                     actionIconProps={{ size: "sm", variant: "subtle", c: "gray" }}
                   />
                 </div>
                 <span>{t("Overview")}</span>
               </div>
            </UnstyledButton>

            <UnstyledButton
              className={classes.menu}
              onClick={searchSpotlight.open}
            >
              <div className={classes.menuItemInner}>
                <div onClick={handleEmojiIconClick} className={classes.emojiIcon}>
                   <EmojiPicker
                     onEmojiSelect={(emoji: any) =>
                       setEmojiConfig((prev) => ({
                         ...prev,
                         search: emoji?.native || emoji?.emoji || emoji,
                       }))
                     }
                     icon={
                       emojiConfig.search ? (
                         <Text size="md">{emojiConfig.search}</Text>
                       ) : (
                         <IconSearch size={18} className={classes.menuItemIcon} stroke={2} />
                       )
                     }
                     readOnly={false}
                     removeEmojiAction={() =>
                       setEmojiConfig((prev) => ({ ...prev, search: null }))
                     }
                     actionIconProps={{ size: "sm", variant: "subtle", c: "gray" }}
                   />
                 </div>
                 <span>{t("Search")}</span>
               </div>
            </UnstyledButton>

            <UnstyledButton className={classes.menu} onClick={openSettings}>
              <div className={classes.menuItemInner}>
                <div onClick={handleEmojiIconClick} className={classes.emojiIcon}>
                   <EmojiPicker
                     onEmojiSelect={(emoji: any) =>
                       setEmojiConfig((prev) => ({
                         ...prev,
                         settings: emoji?.native || emoji?.emoji || emoji,
                       }))
                     }
                     icon={
                       emojiConfig.settings ? (
                         <Text size="md">{emojiConfig.settings}</Text>
                       ) : (
                         <IconSettings size={18} className={classes.menuItemIcon} stroke={2} />
                       )
                     }
                     readOnly={false}
                     removeEmojiAction={() =>
                       setEmojiConfig((prev) => ({ ...prev, settings: null }))
                     }
                     actionIconProps={{ size: "sm", variant: "subtle", c: "gray" }}
                   />
                 </div>
                 <span>{t("Space settings")}</span>
               </div>
            </UnstyledButton>

            {spaceAbility.can(
              SpaceCaslAction.Manage,
              SpaceCaslSubject.Page,
            ) && (
              <UnstyledButton
                className={classes.menu}
                onClick={() => {
                  handleCreatePage();
                  if (mobileSidebarOpened) {
                    toggleMobileSidebar();
                  }
                }}
              >
                <div className={classes.menuItemInner}>
                  <div onClick={handleEmojiIconClick} className={classes.emojiIcon}>
                     <EmojiPicker
                       onEmojiSelect={(emoji: any) =>
                         setEmojiConfig((prev) => ({
                           ...prev,
                           newpage: emoji?.native || emoji?.emoji || emoji,
                         }))
                       }
                       icon={
                         emojiConfig.newpage ? (
                           <Text size="md">{emojiConfig.newpage}</Text>
                         ) : (
                           <IconPlus size={18} className={classes.menuItemIcon} stroke={2} />
                         )
                       }
                       readOnly={false}
                       removeEmojiAction={() =>
                         setEmojiConfig((prev) => ({ ...prev, newpage: null }))
                       }
                       actionIconProps={{ size: "sm", variant: "subtle", c: "gray" }}
                     />
                   </div>
                   <span>{t("New page")}</span>
                 </div>
              </UnstyledButton>
            )}
          </div>
        </div>

        <div className={clsx(classes.section, classes.sectionPages)}>
          <Group className={classes.pagesHeader} justify="space-between">
            <Text size="xs" fw={500} c="dimmed">
              {t("Pages")}
            </Text>

            {spaceAbility.can(
              SpaceCaslAction.Manage,
              SpaceCaslSubject.Page,
            ) && (
              <Group gap="xs">
                <SpaceMenu spaceId={space.id} onSpaceSettings={openSettings} />

                <Tooltip label={t("Create page")} withArrow position="right">
                  <ActionIcon
                    variant="default"
                    size={18}
                    onClick={handleCreatePage}
                    aria-label={t("Create page")}
                  >
                    <IconPlus />
                  </ActionIcon>
                </Tooltip>
              </Group>
            )}
          </Group>

          <div className={classes.pages}>
            <SpaceTree
              spaceId={space.id}
              readOnly={spaceAbility.cannot(
                SpaceCaslAction.Manage,
                SpaceCaslSubject.Page,
              )}
            />
          </div>
        </div>
      </div>

      <SpaceSettingsModal
        opened={opened}
        onClose={closeSettings}
        spaceId={space?.slug}
      />


    </>
  );
}

interface SpaceMenuProps {
  spaceId: string;
  onSpaceSettings: () => void;
}
function SpaceMenu({ spaceId, onSpaceSettings }: SpaceMenuProps) {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const [importOpened, { open: openImportModal, close: closeImportModal }] =
    useDisclosure(false);
  const [exportOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);

  return (
    <>
      <Menu width={200} shadow="md" withArrow>
        <Menu.Target>
          <Tooltip
            label={t("Import pages & space settings")}
            withArrow
            position="top"
          >
            <ActionIcon
              variant="default"
              size={18}
              aria-label={t("Space menu")}
            >
              <IconDots />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            onClick={openImportModal}
            leftSection={<IconArrowDown size={16} />}
          >
            {t("Import pages")}
          </Menu.Item>

          <Menu.Item
            onClick={openExportModal}
            leftSection={<IconFileExport size={16} />}
          >
            {t("Export space")}
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            onClick={onSpaceSettings}
            leftSection={<IconSettings size={16} />}
          >
            {t("Space settings")}
          </Menu.Item>

          <Menu.Item
            component={Link}
            to={`/s/${spaceSlug}/trash`}
            leftSection={<IconTrash size={16} />}
          >
            {t("Trash")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <PageImportModal
        spaceId={spaceId}
        open={importOpened}
        onClose={closeImportModal}
      />

      <ExportModal
        type="space"
        id={spaceId}
        open={exportOpened}
        onClose={closeExportModal}
      />
    </>
  );
}
