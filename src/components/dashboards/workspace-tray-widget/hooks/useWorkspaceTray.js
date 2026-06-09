import { useState, useCallback, useMemo, useEffect } from 'react';
import { inferContentType } from '../utils/fileTypes';

function buildTree(flatFiles, query) {
  const filesWithTypes = flatFiles.map((f) => ({
    ...f,
    content_type:
      f.content_type ||
      (f.type === 'file' ? inferContentType(f.name) : undefined),
  }));

  let filtered = filesWithTypes;

  if (query.trim()) {
    const q = query.toLowerCase();
    const matchingFiles = filesWithTypes.filter(
      (f) => f.type === 'file' && f.name.toLowerCase().includes(q)
    );
    const matchingDirs = filesWithTypes.filter(
      (f) => f.type === 'directory' && f.name.toLowerCase().includes(q)
    );

    const neededDirs = new Set();
    for (const f of matchingFiles) {
      const parts = f.path.split('/');
      for (let i = 1; i < parts.length; i++) {
        neededDirs.add(parts.slice(0, i).join('/'));
      }
    }
    for (const d of matchingDirs) {
      const parts = d.path.split('/');
      for (let i = 1; i < parts.length; i++) {
        neededDirs.add(parts.slice(0, i).join('/'));
      }
    }

    const matchedDirPaths = new Set(matchingDirs.map((d) => d.path));
    const childrenOfMatchedDirs = filesWithTypes.filter((f) => {
      for (const dirPath of matchedDirPaths) {
        if (f.path.startsWith(dirPath + '/')) return true;
      }
      return false;
    });

    const allMatched = new Set([
      ...matchingFiles.map((f) => f.path),
      ...matchingDirs.map((d) => d.path),
      ...childrenOfMatchedDirs.map((f) => f.path),
    ]);

    filtered = [
      ...filesWithTypes.filter(
        (f) => f.type === 'directory' && (neededDirs.has(f.path) || allMatched.has(f.path))
      ),
      ...filesWithTypes.filter(
        (f) => f.type === 'file' && allMatched.has(f.path)
      ),
    ];
  }

  const root = [];
  const dirMap = {};

  for (const entry of filtered) {
    const node = {
      ...entry,
      children: entry.type === 'directory' ? [] : undefined,
    };

    if (entry.type === 'directory') {
      dirMap[entry.path] = node;
    }

    const lastSlash = entry.path.lastIndexOf('/');
    const parentPath =
      lastSlash > 0 ? entry.path.substring(0, lastSlash) : null;

    if (parentPath && dirMap[parentPath]) {
      dirMap[parentPath].children.push(node);
    } else {
      root.push(node);
    }
  }

  return root;
}

export function useWorkspaceTray(externalFiles = null) {
  const [files, setFiles] = useState([]);
  const [expandedDirs, setExpandedDirs] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (externalFiles && Array.isArray(externalFiles)) {
      setFiles(externalFiles);

      if (!hasFetched) {
        const topDirs = new Set(
          externalFiles
            .filter((f) => f.type === 'directory' && !f.path.includes('/'))
            .map((f) => f.path)
        );
        setExpandedDirs(topDirs);
        setHasFetched(true);
      }
    }
  }, [externalFiles, hasFetched]);

  const fetchFiles = useCallback(
    async (fetcher) => {
      if (!fetcher) return;
      setLoading(true);
      setError(null);

      try {
        const fileList = await fetcher();
        setFiles(Array.isArray(fileList) ? fileList : []);

        if (!hasFetched) {
          const topDirs = new Set(
            (fileList || [])
              .filter((f) => f.type === 'directory' && !f.path.includes('/'))
              .map((f) => f.path)
          );
          setExpandedDirs(topDirs);
          setHasFetched(true);
        }
      } catch (e) {
        setError(e.message || 'Failed to load files');
      } finally {
        setLoading(false);
      }
    },
    [hasFetched]
  );

  const toggleDir = useCallback((path) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const fileTree = useMemo(
    () => buildTree(files, searchQuery),
    [files, searchQuery]
  );

  const reset = useCallback(() => {
    setFiles([]);
    setExpandedDirs(new Set());
    setSearchQuery('');
    setHasFetched(false);
    setError(null);
  }, []);

  return {
    files,
    fileTree,
    expandedDirs,
    loading,
    error,
    searchQuery,
    fetchFiles,
    toggleDir,
    setSearchQuery,
    reset,
  };
}
