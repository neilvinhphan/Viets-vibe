import { useEffect, useState } from "react";

import type { LookbookSnapshot } from "../utils/lookbookSnapshot";
import type { LookbookEntry } from "../utils/lookbookStorage";

import {
  LOOKBOOK_STORAGE_KEY,
  loadLookbookCollection,
  commitLookbookCollection,
  validateLookbookTitle,
} from "../utils/lookbookStorage";

export function useLookbookCollection() {
  const [collection, setCollection] = useState(
    loadLookbookCollection,
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (
        event.key === LOOKBOOK_STORAGE_KEY ||
        event.key === null
      ) {
        setCollection(loadLookbookCollection());
      }
    };

    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (
      selectedId &&
      !collection.snapshots.some(
        (item) => item.id === selectedId,
      )
    ) {
      setSelectedId(null);
    }
  }, [collection.snapshots, selectedId]);

  const commit = (
    change: (current: LookbookEntry[]) => LookbookEntry[],
  ) => {
    setCollection(commitLookbookCollection(change));
  };

  const saveSnapshot = (snapshot: LookbookSnapshot) => {
    commit((current) => {
      if (
        current.some((item) => item.id === snapshot.id)
      ) {
        throw new Error("Bản phối này đã được lưu.");
      }

      return [
        {
          ...snapshot,
          favorite: false,
          updatedAt: snapshot.createdAt,
        },
        ...current,
      ];
    });

    setSelectedId(snapshot.id);
  };

  const renameSnapshot = (id: string, name: string) => {
    const title = validateLookbookTitle(name);

    commit((current) => {
      if (!current.some((item) => item.id === id)) {
        throw new Error(
          "Bản phối này không còn trong bộ sưu tập.",
        );
      }

      return current.map((item) =>
        item.id === id
          ? {
              ...item,
              title,
              updatedAt: Date.now(),
            }
          : item,
      );
    });
  };

  const toggleFavorite = (id: string) => {
    commit((current) => {
      if (!current.some((item) => item.id === id)) {
        throw new Error(
          "Bản phối này không còn trong bộ sưu tập.",
        );
      }

      return current.map((item) =>
        item.id === id
          ? {
              ...item,
              favorite: !item.favorite,
              updatedAt: Date.now(),
            }
          : item,
      );
    });
  };

  const deleteSnapshot = (id: string) => {
    commit((current) =>
      current.filter((item) => item.id !== id),
    );

    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  return {
    snapshots: collection.snapshots,
    storageNotice: collection.notice,
    selectedId,
    selectSnapshot: setSelectedId,
    saveSnapshot,
    renameSnapshot,
    toggleFavorite,
    deleteSnapshot,
  };
}