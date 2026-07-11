import { useState, useEffect, useRef } from 'react';
import { MenuBar } from '@/ui/components/MenuBar';
import { Button } from '@/ui/components/Button/Button';
import { Radio, RadioGroup } from '@/ui/components/Radio/Radio';
import {
  Folder,
  Plus,
  DotsThree,
  PencilSimple,
  TrashSimple,
  Check,
  X,
  ArrowLeft,
  LockKey,
  ArrowUp,
  Copy,
  FolderOpen,
  ChatTeardropText,
  Info,
} from '@phosphor-icons/react';
import './ProjectList.css';

const NAV_ITEMS = [
  { id: 'chats', label: 'Workbook', icon: 'chats' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'data-hub', label: 'Data Hub', icon: 'data-hub' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'project', label: 'Projects', icon: 'project' },
];

const INITIAL_PROJECTS = [
  {
    id: 1,
    name: 'Sales Funnel & Deal Performance',
    workbooks: [
      { id: 101, name: 'Lost Deal Touchpoint Journey Analysis', time: '2:01 PM', date: 'Today' },
      { id: 102, name: 'Q1 Pipeline Stage Conversion Rates', time: '11:30 AM', date: 'Today' },
      { id: 103, name: 'Win Rate by Deal Size Segment', time: '9:15 AM', date: 'Yesterday' },
      { id: 104, name: 'Sales Cycle Length Trend Analysis', time: '4:45 PM', date: 'Yesterday' },
    ],
  },
  {
    id: 2,
    name: 'Customer Health & Retention',
    workbooks: [
      { id: 201, name: 'At-Risk Customer Identification Report', time: '3:22 PM', date: 'Today' },
      { id: 202, name: 'Churn Rate by Account Category', time: '10:05 AM', date: 'Yesterday' },
      { id: 203, name: 'Customer Health Score Breakdown', time: '2:30 PM', date: 'Mar 20' },
    ],
  },
  {
    id: 3,
    name: 'Marketing Attribution Analysis',
    workbooks: [
      { id: 301, name: 'MQL to SQL Conversion Funnel', time: '1:15 PM', date: 'Today' },
      { id: 302, name: 'Lead Source Performance Comparison', time: '11:45 AM', date: 'Mar 24' },
    ],
  },
  {
    id: 4,
    name: 'Pipeline Forecasting Q1 2026',
    workbooks: [
      { id: 401, name: 'Weighted Pipeline Value by Stage', time: '4:10 PM', date: 'Today' },
      { id: 402, name: 'Opportunity Aging Analysis', time: '9:00 AM', date: 'Yesterday' },
      { id: 403, name: 'Forecast Accuracy vs Actuals', time: '3:30 PM', date: 'Mar 22' },
    ],
  },
  {
    id: 5,
    name: 'Product Usage Insights',
    workbooks: [
      { id: 501, name: 'Feature Adoption by Account Tier', time: '12:00 PM', date: 'Today' },
      { id: 502, name: 'Visitor Return Rate Trends', time: '10:30 AM', date: 'Mar 23' },
    ],
  },
];

/* ─── Shared dropdown hook ─── */

function useOutsideClick(ref, onClose) {
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, onClose]);
}

/* ─── Project List Dropdown (Rename / Delete) ─── */

function ProjectDropdown({ onClose, onRename, onDelete }) {
  const ref = useRef(null);
  useOutsideClick(ref, onClose);

  return (
    <div className="project-list__dropdown" ref={ref}>
      <button className="project-list__dropdown-item" onClick={() => { onRename(); onClose(); }}>
        <span className="project-list__dropdown-icon"><PencilSimple size={16} weight="regular" /></span>
        Rename
      </button>
      <button className="project-list__dropdown-item project-list__dropdown-item--danger" onClick={() => { onDelete(); onClose(); }}>
        <span className="project-list__dropdown-icon"><TrashSimple size={16} weight="regular" /></span>
        Delete
      </button>
    </div>
  );
}

/* ─── Workbook Context Menu ─── */

function WorkbookDropdown({ projectName, onClose, onRename, onChangeProject, onRemove, onClone, onDelete }) {
  const ref = useRef(null);
  useOutsideClick(ref, onClose);

  return (
    <div className="project-list__dropdown" ref={ref}>
      <button className="project-list__dropdown-item" onClick={() => { onRename(); onClose(); }}>
        <span className="project-list__dropdown-icon"><PencilSimple size={16} weight="regular" /></span>
        Rename
      </button>
      <button className="project-list__dropdown-item" onClick={() => { onChangeProject(); onClose(); }}>
        <span className="project-list__dropdown-icon"><FolderOpen size={16} weight="regular" /></span>
        Change project
      </button>
      <button className="project-list__dropdown-item" onClick={() => { onRemove(); onClose(); }}>
        <span className="project-list__dropdown-icon"><X size={16} weight="regular" /></span>
        Remove from {projectName}
      </button>
      <button className="project-list__dropdown-item" onClick={() => { onClone(); onClose(); }}>
        <span className="project-list__dropdown-icon"><Copy size={16} weight="regular" /></span>
        Clone
      </button>
      <div className="project-list__dropdown-divider" />
      <button className="project-list__dropdown-item project-list__dropdown-item--danger" onClick={() => { onDelete(); onClose(); }}>
        <span className="project-list__dropdown-icon"><TrashSimple size={16} weight="regular" /></span>
        Delete chat
      </button>
    </div>
  );
}

/* ─── Move Chat Modal ─── */

function MoveChatModal({ projects, currentProjectId, onClose, onMove, onCreate }) {
  const [mode, setMode] = useState('existing');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');

  const otherProjects = projects.filter((p) => p.id !== currentProjectId);
  const canConfirm = mode === 'existing' ? selectedProjectId !== null : newProjectName.trim() !== '';
  const confirmLabel = mode === 'existing' ? 'Move' : 'Create & Add';

  function handleConfirm() {
    if (mode === 'existing' && selectedProjectId !== null) {
      onMove(selectedProjectId);
    } else if (mode === 'new' && newProjectName.trim()) {
      onCreate(newProjectName.trim());
    }
    onClose();
  }

  return (
    <div className="move-chat__overlay" onClick={onClose}>
      <div className="move-chat__modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="move-chat__header">
          <div className="move-chat__header-text">
            <h2 className="move-chat__title">Move chat</h2>
            <p className="move-chat__subtitle">Select a project to move this chat into.</p>
          </div>
          <button type="button" className="move-chat__close" onClick={onClose} aria-label="Close">
            <X size={16} weight="regular" />
          </button>
        </div>

        {/* Body */}
        <div className="move-chat__body">
          <div className="move-chat__options">
            {/* Option: existing project */}
            <label className="move-chat__radio-option">
              <input
                type="radio"
                className="move-chat__radio-input"
                name="move-mode"
                checked={mode === 'existing'}
                onChange={() => setMode('existing')}
              />
              <span className={`move-chat__radio-circle ${mode === 'existing' ? 'move-chat__radio-circle--active' : ''}`} />
              <span className={`move-chat__radio-label ${mode !== 'existing' ? 'move-chat__radio-label--muted' : ''}`}>
                Add to an existing project
              </span>
            </label>

            {mode === 'existing' && (
              <div className="move-chat__project-list">
                {otherProjects.map((p) => (
                  <label key={p.id} className="move-chat__project-option">
                    <input
                      type="radio"
                      className="move-chat__radio-input"
                      name="target-project"
                      checked={selectedProjectId === p.id}
                      onChange={() => setSelectedProjectId(p.id)}
                    />
                    <span className={`move-chat__radio-circle ${selectedProjectId === p.id ? 'move-chat__radio-circle--active' : ''}`} />
                    <Folder size={14} weight="regular" color="var(--color-text-secondary)" />
                    <span className="move-chat__project-name">{p.name}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Option: new project */}
            <label className="move-chat__radio-option">
              <input
                type="radio"
                className="move-chat__radio-input"
                name="move-mode"
                checked={mode === 'new'}
                onChange={() => setMode('new')}
              />
              <span className={`move-chat__radio-circle ${mode === 'new' ? 'move-chat__radio-circle--active' : ''}`} />
              <span className={`move-chat__radio-label ${mode !== 'new' ? 'move-chat__radio-label--muted' : ''}`}>
                Create a new project
              </span>
            </label>

            {mode === 'new' && (
              <div className="move-chat__new-input-wrap">
                <input
                  type="text"
                  className="move-chat__new-input"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  autoFocus
                />
                {newProjectName && (
                  <button type="button" className="move-chat__new-clear" onClick={() => setNewProjectName('')} aria-label="Clear">
                    <X size={20} weight="regular" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Info tip */}
          <div className="move-chat__info-tip">
            <Info size={16} weight="regular" color="var(--color-text-secondary)" />
            <span>Projects keep chats in one place. Use them for ongoing work, or just to keep things tidy.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="move-chat__footer">
          <Button variant="ghost" size="md" label="Cancel" onClick={onClose} />
          <Button variant="primary" size="md" label={confirmLabel} disabled={!canConfirm} onClick={handleConfirm} />
        </div>
      </div>
    </div>
  );
}

/* ─── Project Row ─── */

function ProjectRow({ project, onRename, onDelete, onOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(project.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleRenameStart() { setEditValue(project.name); setEditing(true); }
  function handleRenameConfirm() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== project.name) onRename(project.id, trimmed);
    setEditing(false);
  }
  function handleRenameCancel() { setEditValue(project.name); setEditing(false); }
  function handleKeyDown(e) {
    if (e.key === 'Enter') handleRenameConfirm();
    if (e.key === 'Escape') handleRenameCancel();
  }

  return (
    <div className="project-list__row" onClick={() => !editing && onOpen(project)}>
      <div className="project-list__row-left">
        <Folder size={16} weight="regular" color="var(--color-text-primary)" />
        {editing ? (
          <div className="project-list__rename-wrap">
            <input
              ref={inputRef}
              type="text"
              className="project-list__rename-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleRenameConfirm}
            />
            <button type="button" className="project-list__rename-btn project-list__rename-btn--confirm" onMouseDown={(e) => { e.preventDefault(); handleRenameConfirm(); }} aria-label="Confirm">
              <Check size={14} weight="bold" />
            </button>
            <button type="button" className="project-list__rename-btn project-list__rename-btn--cancel" onMouseDown={(e) => { e.preventDefault(); handleRenameCancel(); }} aria-label="Cancel">
              <X size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <span className="project-list__row-name project-list__row-name--clickable">{project.name}</span>
        )}
      </div>
      <div className="project-list__dots-wrapper">
        <button className="project-list__dots-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} aria-label="Actions">
          <DotsThree size={16} weight="regular" />
        </button>
        {menuOpen && (
          <ProjectDropdown
            onClose={() => setMenuOpen(false)}
            onRename={handleRenameStart}
            onDelete={() => onDelete(project.id)}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Workbook Row ─── */

function WorkbookRow({ workbook, projectName, userInitials, onRename, onChangeProject, onRemove, onClone, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="project-detail__wb-row">
      <div className="project-detail__wb-left">
        <div className="project-detail__wb-avatar">{userInitials}</div>
        <span className="project-detail__wb-name">{workbook.name}</span>
      </div>
      <div className="project-detail__wb-right">
        <span className="project-detail__wb-time">{workbook.time}</span>
        <div className="project-list__dots-wrapper">
          <button className="project-list__dots-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Actions">
            <DotsThree size={16} weight="regular" />
          </button>
          {menuOpen && (
            <WorkbookDropdown
              projectName={projectName}
              onClose={() => setMenuOpen(false)}
              onRename={() => onRename(workbook.id)}
              onChangeProject={() => onChangeProject(workbook.id)}
              onRemove={() => onRemove(workbook.id)}
              onClone={() => onClone(workbook.id)}
              onDelete={() => onDelete(workbook.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Project Detail View ─── */

function ProjectDetail({ project, userInitials, onBack, onUpdateProject, allProjects, onMoveWorkbook, onCreateProjectAndMove }) {
  const [workbooks, setWorkbooks] = useState(project.workbooks);
  const [question, setQuestion] = useState('');
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [movingWorkbookId, setMovingWorkbookId] = useState(null);
  const projectMenuRef = useRef(null);
  useOutsideClick(projectMenuRef, () => setProjectMenuOpen(false));

  function handleRenameWorkbook(wbId) {
    const wb = workbooks.find((w) => w.id === wbId);
    if (!wb) return;
    const newName = prompt('Rename workbook:', wb.name);
    if (newName && newName.trim()) {
      setWorkbooks(workbooks.map((w) => (w.id === wbId ? { ...w, name: newName.trim() } : w)));
    }
  }

  function handleRemoveWorkbook(wbId) {
    setWorkbooks(workbooks.filter((w) => w.id !== wbId));
  }

  function handleCloneWorkbook(wbId) {
    const wb = workbooks.find((w) => w.id === wbId);
    if (!wb) return;
    const nextId = Math.max(...workbooks.map((w) => w.id)) + 1;
    setWorkbooks([{ ...wb, id: nextId, name: `${wb.name} (copy)` }, ...workbooks]);
  }

  function handleDeleteWorkbook(wbId) {
    setWorkbooks(workbooks.filter((w) => w.id !== wbId));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;
    const nextId = workbooks.length > 0 ? Math.max(...workbooks.map((w) => w.id)) + 1 : 1;
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const time = `${hours % 12 || 12}:${mins} ${ampm}`;
    setWorkbooks([{ id: nextId, name: question.trim(), time, date: 'Today' }, ...workbooks]);
    setQuestion('');
  }

  // Group workbooks by date
  const grouped = {};
  for (const wb of workbooks) {
    if (!grouped[wb.date]) grouped[wb.date] = [];
    grouped[wb.date].push(wb);
  }

  return (
    <div className="project-detail">
      {/* Back button */}
      <button type="button" className="project-detail__back" onClick={onBack}>
        <ArrowLeft size={16} weight="regular" />
        <span>All Projects</span>
      </button>

      {/* Title row */}
      <div className="project-detail__title-row">
        <h1 className="project-list__title">{project.name}</h1>
        <div className="project-list__dots-wrapper" ref={projectMenuRef}>
          <button className="project-list__dots-btn" onClick={() => setProjectMenuOpen(!projectMenuOpen)} aria-label="Project actions">
            <DotsThree size={16} weight="regular" />
          </button>
          {projectMenuOpen && (
            <ProjectDropdown
              onClose={() => setProjectMenuOpen(false)}
              onRename={() => {
                const newName = prompt('Rename project:', project.name);
                if (newName && newName.trim()) onUpdateProject({ ...project, name: newName.trim() });
              }}
              onDelete={() => { onBack(); }}
            />
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="project-detail__meta">
        <span className="project-detail__meta-text">Created by you</span>
        <span className="project-detail__meta-privacy">
          <LockKey size={12} weight="regular" color="var(--color-text-secondary)" />
          <span>This project is private</span>
        </span>
      </div>

      {/* Divider */}
      <div className="project-detail__divider" />

      {/* Ask anything box */}
      <form className="project-detail__ask-box" onSubmit={handleSubmit}>
        <textarea
          className="project-detail__ask-input"
          placeholder="Ask anything"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
        />
        <div className="project-detail__ask-footer">
          <button
            type="submit"
            className={`project-detail__ask-submit ${question.trim() ? 'project-detail__ask-submit--active' : ''}`}
            disabled={!question.trim()}
            aria-label="Submit"
          >
            <ArrowUp size={12} weight="bold" />
          </button>
        </div>
      </form>

      {/* Workbook list */}
      <div className="project-detail__workbooks">
        {Object.entries(grouped).map(([date, wbs]) => (
          <div key={date} className="project-detail__wb-group">
            <div className="project-detail__wb-date-header">
              <span className="project-detail__wb-date">{date}</span>
            </div>
            {wbs.map((wb) => (
              <WorkbookRow
                key={wb.id}
                workbook={wb}
                projectName={project.name}
                userInitials={userInitials}
                onRename={handleRenameWorkbook}
                onChangeProject={(wbId) => setMovingWorkbookId(wbId)}
                onRemove={handleRemoveWorkbook}
                onClone={handleCloneWorkbook}
                onDelete={handleDeleteWorkbook}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Move chat modal */}
      {movingWorkbookId !== null && (
        <MoveChatModal
          projects={allProjects}
          currentProjectId={project.id}
          onClose={() => setMovingWorkbookId(null)}
          onMove={(targetProjectId) => {
            const wb = workbooks.find((w) => w.id === movingWorkbookId);
            if (wb) {
              setWorkbooks(workbooks.filter((w) => w.id !== movingWorkbookId));
              onMoveWorkbook(wb, targetProjectId);
            }
          }}
          onCreate={(newProjectName) => {
            const wb = workbooks.find((w) => w.id === movingWorkbookId);
            if (wb) {
              setWorkbooks(workbooks.filter((w) => w.id !== movingWorkbookId));
              onCreateProjectAndMove(wb, newProjectName);
            }
          }}
        />
      )}
    </div>
  );
}

/* ─── Main ProjectList Page ─── */

export function ProjectList({
  user = { name: 'Ammie Diego', initials: 'AD', email: 'ammie.diego@work.com' },
  onNavigate,
  menuOpen,
  onMenuToggle,
}) {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [openProject, setOpenProject] = useState(null);

  function handleNewProject() {
    const nextId = projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
    setProjects([{ id: nextId, name: `New Project ${nextId}`, workbooks: [] }, ...projects]);
  }

  function handleRename(id, newName) {
    setProjects(projects.map((p) => (p.id === id ? { ...p, name: newName } : p)));
    if (openProject && openProject.id === id) setOpenProject({ ...openProject, name: newName });
  }

  function handleDelete(id) {
    setProjects(projects.filter((p) => p.id !== id));
    if (openProject && openProject.id === id) setOpenProject(null);
  }

  function handleUpdateProject(updated) {
    setProjects(projects.map((p) => (p.id === updated.id ? { ...p, name: updated.name } : p)));
    setOpenProject({ ...openProject, name: updated.name });
  }

  function handleMoveWorkbook(wb, targetProjectId) {
    setProjects(projects.map((p) => {
      if (p.id === targetProjectId) return { ...p, workbooks: [wb, ...p.workbooks] };
      return p;
    }));
  }

  function handleCreateProjectAndMove(wb, newProjectName) {
    const nextId = projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
    setProjects([...projects, { id: nextId, name: newProjectName, workbooks: [wb] }]);
  }

  return (
    <div className="project-list">
      <MenuBar
        items={NAV_ITEMS}
        activeId="project"
        onItemClick={(id) => onNavigate && onNavigate(id)}
        user={user}
        onNewChat={() => onNavigate && onNavigate('new-chat')}
        isOpen={menuOpen}
        onToggle={onMenuToggle}
        onProfile={() => onNavigate && onNavigate('profile')}
        onSettings={() => onNavigate && onNavigate('settings')}
      />

      <div className="project-list__body">
        <div className="project-list__header">
          <span className="project-list__breadcrumb">Projects</span>
        </div>

        <div className="project-list__center">
          {openProject ? (
            <div className="project-list__main">
              <ProjectDetail
                project={openProject}
                userInitials={user.initials}
                onBack={() => setOpenProject(null)}
                onUpdateProject={handleUpdateProject}
                allProjects={projects}
                onMoveWorkbook={handleMoveWorkbook}
                onCreateProjectAndMove={handleCreateProjectAndMove}
              />
            </div>
          ) : (
            <div className="project-list__main">
              <div className="project-list__title-row">
                <h1 className="project-list__title">Projects</h1>
                <Button
                  variant="primary"
                  size="md"
                  icon={Plus}
                  label="New Project"
                  onClick={handleNewProject}
                />
              </div>
              <div className="project-list__col-header">
                <span className="project-list__col-label">Project Name</span>
              </div>
              <div className="project-list__rows">
                {projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onOpen={setOpenProject}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
