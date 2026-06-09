import { useState, useRef } from 'react';
import WorkspaceTray from './index';

export function BasicExample() {
  const [activeFile, setActiveFile] = useState(null);

  const fetchFiles = async () => {
    const response = await fetch('/api/files');
    if (!response.ok) throw new Error('Failed to fetch files');
    const data = await response.json();
    return data.files;
  };

  return (
    <div className="w-64 h-screen">
      <WorkspaceTray
        fetchFiles={fetchFiles}
        onFileClick={(file) => setActiveFile(file.path)}
        autoFetch={true}
      />
    </div>
  );
}

export function RefExample() {
  const trayRef = useRef();

  const fetchFiles = async () => [
    { path: 'docs', name: 'docs', type: 'directory' },
    { path: 'docs/readme.md', name: 'readme.md', type: 'file', size: 1024 },
  ];

  return (
    <div className="w-64 h-screen">
      <WorkspaceTray
        ref={trayRef}
        fetchFiles={fetchFiles}
        onFileClick={(f) => console.log(f)}
        autoFetch={true}
      />
      <button onClick={() => trayRef.current?.refresh()}>Refresh Files</button>
    </div>
  );
}

export function MockDataExample() {
  const [activeFile, setActiveFile] = useState(null);

  const fetchFiles = async () => {
    await new Promise((r) => setTimeout(r, 500));

    return [
      { path: 'catalog', name: 'catalog', type: 'directory' },
      {
        path: 'catalog/tables.md',
        name: 'tables.md',
        type: 'file',
        size: 2048,
      },
      { path: 'output', name: 'output', type: 'directory' },
      {
        path: 'output/report.html',
        name: 'report.html',
        type: 'file',
        size: 15360,
      },
      { path: 'output/data.csv', name: 'data.csv', type: 'file', size: 8192 },
      {
        path: 'output/chart.png',
        name: 'chart.png',
        type: 'file',
        size: 45000,
      },
      { path: 'scripts', name: 'scripts', type: 'directory' },
      {
        path: 'scripts/analysis.py',
        name: 'analysis.py',
        type: 'file',
        size: 3500,
      },
      { path: 'uploads', name: 'uploads', type: 'directory' },
      {
        path: 'uploads/input.json',
        name: 'input.json',
        type: 'file',
        size: 1200,
      },
    ];
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <div className="w-56">
        <WorkspaceTray
          fetchFiles={fetchFiles}
          onFileClick={(file) => setActiveFile(file)}
          autoFetch={true}
          title="Files"
        />
      </div>
      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Workspace Tray Demo
        </h1>
        {activeFile ? (
          <pre className="p-4 rounded-lg bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)]">
            {JSON.stringify(activeFile, null, 2)}
          </pre>
        ) : (
          <p className="text-[var(--text-muted)]">
            Click a file to view details
          </p>
        )}
      </main>
    </div>
  );
}

export default MockDataExample;
