import { useState, useMemo } from 'react';
import { Toggle } from '@/ui/components/Toggle/Toggle';
import { Button } from '@/ui/components/Button/Button';
import {
  CaretRight,
  CaretDown,
  CaretLeft,
  MagnifyingGlass,
  Funnel,
  PencilSimple,
  X,
} from '@phosphor-icons/react';

/* ─── Sample table/column data per source ─── */

const SOURCE_TABLES = {
  salesforce: [
    {
      name: 'Accounts', columnCount: 388, enabled: true,
      description: 'Stores account-level data including company info, health scores, contract dates, and categorization.',
      columns: [
        { name: 'ID', column: 'Id', dataType: 'MediumText', description: 'Unique identifier for each account record.', enabled: true },
        { name: 'Name', column: 'Name', dataType: 'MediumText', description: 'The name of the account or company.', enabled: true },
        { name: 'Type', column: 'Type', dataType: 'MediumText', description: 'Account classification such as Customer, Prospect, or Partner.', enabled: true },
        { name: 'Industry', column: 'Industry', dataType: 'MediumText', description: 'The industry sector the account belongs to.', enabled: false },
        { name: 'ARR', column: 'ARR__c', dataType: 'Decimal', description: 'Annual Recurring Revenue for the account.', enabled: true },
        { name: 'Health Score', column: 'Account_Health__c', dataType: 'Decimal', description: 'Overall health score of the account from 0 to 100.', enabled: false },
        { name: 'Created Date', column: 'CreatedDate', dataType: 'Timestamp', description: 'Timestamp of when the account was created.', enabled: true },
        { name: 'Parent Account ID', column: 'ParentId', dataType: 'MediumText', description: 'References the parent account for hierarchical structures.', enabled: false },
      ],
    },
    {
      name: 'Cases', columnCount: 170, enabled: false,
      description: 'Tracks customer support cases including status, priority, and resolution details.',
      columns: [
        { name: 'Case ID', column: 'Id', dataType: 'MediumText', description: 'Unique identifier for each case.', enabled: true },
        { name: 'Status', column: 'Status', dataType: 'MediumText', description: 'Current status of the support case.', enabled: true },
        { name: 'Priority', column: 'Priority', dataType: 'MediumText', description: 'Priority level assigned to the case.', enabled: false },
        { name: 'Created Date', column: 'CreatedDate', dataType: 'Timestamp', description: 'When the case was created.', enabled: true },
      ],
    },
    {
      name: 'Contacts', columnCount: 392, enabled: true,
      description: 'Contains contact information linked to accounts including names, emails, and MQL dates.',
      columns: [
        { name: 'Contact ID', column: 'Id', dataType: 'MediumText', description: 'Unique identifier for each contact.', enabled: true },
        { name: 'First Name', column: 'FirstName', dataType: 'MediumText', description: 'First name of the contact.', enabled: true },
        { name: 'Email', column: 'Email', dataType: 'MediumText', description: 'Email address of the contact.', enabled: true },
        { name: 'Account Name', column: 'Account_Name__c', dataType: 'MediumText', description: 'Name of the associated account.', enabled: false },
        { name: 'MQL Date', column: 'MQL_Date__c', dataType: 'Timestamp', description: 'Date when the contact became a Marketing Qualified Lead.', enabled: true },
      ],
    },
    {
      name: 'Leads', columnCount: 330, enabled: true,
      description: 'Stores lead data including status, source, conversion details, and ownership.',
      columns: [
        { name: 'ID', column: 'Id', dataType: 'MediumText', description: 'Unique identifier for each lead.', enabled: true },
        { name: 'Status', column: 'Status', dataType: 'MediumText', description: 'Current status of the lead.', enabled: true },
        { name: 'Converted', column: 'IsConverted', dataType: 'Tinyint(4)', description: 'Whether the lead has been converted to a contact.', enabled: true },
        { name: 'Created Date', column: 'CreatedDate', dataType: 'Timestamp', description: 'When the lead was created.', enabled: true },
      ],
    },
    {
      name: 'Opportunity', columnCount: 57, enabled: true,
      description: 'The salesforce_opportunities table is a critical component of the dataset, designed to store and manage data related to sales opportunities within an organization. This table captures the lifecycle of sales opportunities, from initial proposal to final outcome.',
      columns: [
        { name: 'ID', column: 'Id', dataType: 'MediumText', description: 'Unique identifier for each history record, crucial for data tracking and integrity.', enabled: true },
        { name: 'Is Deleted', column: 'IsDeleted', dataType: 'Tinyint(4)', description: 'Indicates whether the history record has been deleted (1) or not (0), aiding in data cleanup and integrity checks.', enabled: true },
        { name: 'Account ID', column: 'AccountId', dataType: 'MediumText', description: 'References the unique identifier of the account to which the history record belongs, establishing a direct link between the account and its historical changes.', enabled: false },
        { name: 'Created by ID', column: 'CreatedById', dataType: 'MediumText', description: 'Identifies the user who created the history record, providing insights into user activity and accountability.', enabled: false },
        { name: 'Created Date', column: 'CreatedDate', dataType: 'MediumText', description: 'Timestamp of when the history record was created, essential for chronological tracking of account changes.', enabled: true },
        { name: 'Field', column: 'Field', dataType: 'MediumText', description: 'Specifies the account field that was changed, offering a focused view on what aspect of the account was modified.', enabled: false },
        { name: 'Data Type', column: 'DataType', dataType: 'MediumText', description: 'Defines the type of data (e.g., text, date, enum) that was changed, helping in understanding the nature of the information altered.', enabled: false },
        { name: 'Created at', column: 'created_at', dataType: 'Timestamp', description: 'System-generated timestamp indicating when the history record was initially created in the database, useful for data management and audit purposes.', enabled: true },
      ],
    },
    {
      name: 'Opportunity History', columnCount: 16, enabled: false,
      description: 'Tracks historical changes to opportunity records over time.',
      columns: [
        { name: 'ID', column: 'Id', dataType: 'MediumText', description: 'Unique identifier for the history record.', enabled: true },
        { name: 'Opportunity ID', column: 'OpportunityId', dataType: 'MediumText', description: 'The opportunity this history entry relates to.', enabled: true },
        { name: 'Created Date', column: 'CreatedDate', dataType: 'Timestamp', description: 'When this history entry was created.', enabled: true },
      ],
    },
    {
      name: 'Tasks', columnCount: 125, enabled: false,
      description: 'Stores task records associated with accounts, contacts, and opportunities.',
      columns: [
        { name: 'Task ID', column: 'Id', dataType: 'MediumText', description: 'Unique identifier for the task.', enabled: true },
        { name: 'Account ID', column: 'AccountId', dataType: 'MediumText', description: 'Account associated with this task.', enabled: true },
        { name: 'Status', column: 'Status', dataType: 'MediumText', description: 'Current status of the task.', enabled: false },
        { name: 'Created Date', column: 'CreatedDate', dataType: 'Timestamp', description: 'When the task was created.', enabled: true },
      ],
    },
    {
      name: 'Users', columnCount: 196, enabled: false,
      description: 'Contains user records for the Salesforce organization.',
      columns: [
        { name: 'User ID', column: 'Id', dataType: 'MediumText', description: 'Unique identifier for the user.', enabled: true },
        { name: 'Name', column: 'Name', dataType: 'MediumText', description: 'Full name of the user.', enabled: true },
        { name: 'Email', column: 'Email', dataType: 'MediumText', description: 'Email address of the user.', enabled: false },
      ],
    },
  ],
  marketo: [
    {
      name: 'Leads', columnCount: 85, enabled: true,
      description: 'Marketo lead records with MQL and ownership data.',
      columns: [
        { name: 'ID', column: 'id', dataType: 'MediumText', description: 'Unique lead identifier.', enabled: true },
        { name: 'Owner Type', column: 'owner_type_c', dataType: 'MediumText', description: 'Type of lead owner.', enabled: true },
        { name: 'MQL Date', column: 'mql_date_c', dataType: 'Timestamp', description: 'Date the lead became MQL.', enabled: true },
      ],
    },
    {
      name: 'Forms', columnCount: 42, enabled: false,
      description: 'Marketo form definitions and metadata.',
      columns: [
        { name: 'ID', column: 'id', dataType: 'MediumText', description: 'Unique form identifier.', enabled: true },
        { name: 'Name', column: 'name', dataType: 'MediumText', description: 'Form name.', enabled: true },
      ],
    },
  ],
};

/* Default fallback for sources without specific data */
function getTablesForSource(logoKey) {
  return SOURCE_TABLES[logoKey] || SOURCE_TABLES.salesforce;
}

/* ─── Data type tag colors ─── */

const TYPE_COLORS = {
  MediumText: { bg: '#E0FDFF', color: '#0D787F' },
  Timestamp: { bg: '#FFF3E0', color: '#E65100' },
  Decimal: { bg: '#E8F5E9', color: '#2E7D32' },
  'Tinyint(4)': { bg: '#E0FDFF', color: '#0D787F' },
};

/* ─── Tags dropdown options ─── */
const TAG_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'object-view', label: 'Object View' },
];

/* ─── Format dropdown options per data type ─── */
const FORMAT_OPTIONS_BY_TYPE = {
  Timestamp: [
    { id: 'date', label: 'Date', hint: '(YYYY-MM-DD)' },
    { id: 'datetime', label: 'Date and Time', hint: '(YYYY-MM-DD  hh:mm:ss)' },
    { id: 'none', label: 'None', hint: '' },
  ],
  Decimal: [
    { id: 'currency', label: 'Currency', hint: '' },
    { id: 'none', label: 'None', hint: '' },
  ],
  Integer: [
    { id: 'currency', label: 'Currency', hint: '' },
    { id: 'none', label: 'None', hint: '' },
  ],
};

/** Check if a data type supports format options */
function getFormatOptions(dataType) {
  return FORMAT_OPTIONS_BY_TYPE[dataType] || null;
}

/* ─── Sample data per column (mock) ─── */
const SAMPLE_VALUES = [
  'Gibson, Kreiger and Zulauf',
  'Sawayn - Crist',
  'Braun and Sons',
  'Beier and Sons',
  'Erdman - Little',
  'Dach LLC',
  'Beier and Sons',
  'Hettinger, Rippin and Smith',
  'Beier and Sons',
  'Bernhard - Marquardt',
];

/* ─── Sample Data Modal ─── */

function SampleDataModal({ col, onClose }) {
  return (
    <div className="edit-col__overlay" onClick={onClose}>
      <div className="sample-data__modal" onClick={(e) => e.stopPropagation()}>
        <div className="sample-data__header">
          <h2 className="edit-col__title">Sample Data for {col.name}</h2>
          <button type="button" className="edit-col__close" onClick={onClose} aria-label="Close">
            <X size={16} weight="regular" />
          </button>
        </div>
        <div className="sample-data__body">
          <div className="sample-data__table">
            <div className="sample-data__table-header">
              <span>{col.column}</span>
            </div>
            {SAMPLE_VALUES.map((val, i) => (
              <div key={i} className="sample-data__table-row">
                <span>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Column Modal ─── */

function EditColumnModal({ col, onClose }) {
  const [fieldName, setFieldName] = useState(col.name);
  const [description, setDescription] = useState(col.description);
  const [activeTab, setActiveTab] = useState('general');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('none');
  const [tagsOpen, setTagsOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const typeStyle = TYPE_COLORS[col.dataType] || TYPE_COLORS.MediumText;
  const formatOptions = getFormatOptions(col.dataType);
  const formatSupported = formatOptions !== null;

  const isDirty = fieldName !== col.name || description !== col.description || selectedTags.length > 0 || selectedFormat !== 'none';

  function toggleTag(tagId) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  return (
    <div className="edit-col__overlay" onClick={onClose}>
      <div className="edit-col__modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-col__header">
          <div className="edit-col__header-left">
            <h2 className="edit-col__title">Edit {col.column}</h2>
            <span className="dict-detail__type-tag" style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>
              {col.dataType}
            </span>
          </div>
          <button type="button" className="edit-col__close" onClick={onClose} aria-label="Close">
            <X size={16} weight="regular" />
          </button>
        </div>

        {/* Tabs */}
        <div className="edit-col__tabs">
          <button
            type="button"
            className={`edit-col__tab ${activeTab === 'general' ? 'edit-col__tab--active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            type="button"
            className={`edit-col__tab ${activeTab === 'connected' ? 'edit-col__tab--active' : ''}`}
            onClick={() => setActiveTab('connected')}
          >
            Connected Fields
          </button>
        </div>

        {/* Body */}
        <div className="edit-col__body">
          {activeTab === 'general' && (
            <>
              <div className="edit-col__field">
                <label className="edit-col__label">Field name</label>
                <input
                  type="text"
                  className="edit-col__input"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                />
              </div>
              <div className="edit-col__field">
                <label className="edit-col__label">Description</label>
                <textarea
                  className="edit-col__textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Tags dropdown */}
              <div className="edit-col__field">
                <label className="edit-col__label">Tags</label>
                <div className="edit-col__dropdown-wrapper">
                  <div
                    className={`edit-col__select ${tagsOpen ? 'edit-col__select--active' : ''}`}
                    onClick={() => { setTagsOpen(!tagsOpen); setFormatOpen(false); }}
                  >
                    {selectedTags.length > 0 ? (
                      <div className="edit-col__selected-tags">
                        {selectedTags.map((tagId) => {
                          const tag = TAG_OPTIONS.find((t) => t.id === tagId);
                          return tag ? (
                            <span key={tagId} className="dict-detail__col-tag">{tag.label}</span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="edit-col__select-placeholder">Select tags</span>
                    )}
                    <CaretDown size={20} weight="regular" color="var(--color-text-disabled)" />
                  </div>
                  {tagsOpen && (
                    <div className="edit-col__dropdown-menu">
                      {TAG_OPTIONS.map((tag) => (
                        <label key={tag.id} className="edit-col__dropdown-item">
                          <input
                            type="checkbox"
                            className="edit-col__checkbox"
                            checked={selectedTags.includes(tag.id)}
                            onChange={() => toggleTag(tag.id)}
                          />
                          <span className="dict-detail__col-tag">{tag.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Format dropdown — disabled for types without format support */}
              <div className="edit-col__field">
                <label className="edit-col__label">Format</label>
                <div className="edit-col__dropdown-wrapper">
                  <div
                    className={`edit-col__select ${formatOpen ? 'edit-col__select--active' : ''} ${!formatSupported ? 'edit-col__select--disabled' : ''}`}
                    onClick={() => { if (formatSupported) { setFormatOpen(!formatOpen); setTagsOpen(false); } }}
                  >
                    <span className={formatSupported ? 'edit-col__select-value' : 'edit-col__select-placeholder'}>
                      {formatSupported
                        ? (formatOptions.find((f) => f.id === selectedFormat)?.label || 'None')
                        : 'None'}
                    </span>
                    <CaretDown size={20} weight="regular" color="var(--color-text-disabled)" />
                  </div>
                  {formatOpen && formatSupported && (
                    <div className="edit-col__dropdown-menu">
                      {formatOptions.map((fmt) => (
                        <label key={fmt.id} className="edit-col__dropdown-radio">
                          <input
                            type="radio"
                            name="format"
                            className="edit-col__radio"
                            checked={selectedFormat === fmt.id}
                            onChange={() => { setSelectedFormat(fmt.id); setFormatOpen(false); }}
                          />
                          <span className="edit-col__radio-circle-inner" />
                          <span className="edit-col__dropdown-radio-label">
                            {fmt.label}
                            {fmt.hint && <span className="edit-col__dropdown-radio-hint"> {fmt.hint}</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {activeTab === 'connected' && (
            <div className="edit-col__empty">
              <span className="edit-col__empty-text">No connected fields configured.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="edit-col__footer">
          <Button variant="ghost" size="md" label="Cancel" onClick={onClose} />
          <Button variant={isDirty ? 'primary' : 'secondary'} size="md" label="Verify & Save" disabled={!isDirty} />
        </div>
      </div>
    </div>
  );
}

/* ─── Column Row (expandable) ─── */

function ColumnRow({ index, col }) {
  const [expanded, setExpanded] = useState(false);
  const [enabled, setEnabled] = useState(col.enabled);
  const [editOpen, setEditOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const typeStyle = TYPE_COLORS[col.dataType] || TYPE_COLORS.MediumText;

  return (
    <div className={`dict-detail__col-wrapper ${expanded ? 'dict-detail__col-wrapper--expanded' : ''}`}>
      <div className="dict-detail__col-row" onClick={() => setExpanded(!expanded)}>
        <span className="dict-detail__col-num">{index}.</span>
        <span className="dict-detail__col-expand">
          {expanded
            ? <CaretDown size={12} weight="regular" color="var(--color-text-secondary)" />
            : <CaretRight size={12} weight="regular" color="var(--color-text-secondary)" />}
        </span>
        <span className="dict-detail__col-field">{col.name}</span>
        <span className="dict-detail__col-column">{col.column}</span>
        <span className="dict-detail__col-type">
          <span className="dict-detail__type-tag" style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>
            {col.dataType}
          </span>
        </span>
        <span className="dict-detail__col-desc">
          <span className="dict-detail__col-desc-text">{col.description}</span>
        </span>
        <span className="dict-detail__col-sample">
          <button type="button" className="dict-detail__view-btn" onClick={(e) => { e.stopPropagation(); setSampleOpen(true); }}>View</button>
        </span>
        <span className="dict-detail__col-toggle">
          <Toggle checked={enabled} onChange={() => setEnabled(!enabled)} />
        </span>
        <span className="dict-detail__col-edit">
          <button
            type="button"
            className="dict-detail__edit-btn"
            onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
            aria-label="Edit column"
          >
            <PencilSimple size={14} weight="regular" />
          </button>
        </span>
      </div>
      {expanded && (
        <div className="dict-detail__col-expanded">
          <div className="dict-detail__col-expanded-divider" />
          <div className="dict-detail__col-expanded-grid">
            <div className="dict-detail__col-expanded-cell">
              <span className="dict-detail__col-expanded-label">Format</span>
              <span className="dict-detail__col-expanded-value">-</span>
            </div>
            <div className="dict-detail__col-expanded-cell">
              <span className="dict-detail__col-expanded-label">Data Fill %</span>
              <span className="dict-detail__col-expanded-value">100%</span>
            </div>
            <div className="dict-detail__col-expanded-cell">
              <span className="dict-detail__col-expanded-label">Tags</span>
              <div className="dict-detail__col-expanded-tags">
                {col.enabled && <span className="dict-detail__col-tag">Default</span>}
              </div>
            </div>
            <div className="dict-detail__col-expanded-cell dict-detail__col-expanded-cell--wide">
              <span className="dict-detail__col-expanded-label">Connected Fields</span>
              <div className="dict-detail__col-expanded-tags">
                <span className="dict-detail__col-tag">{col.name}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {editOpen && <EditColumnModal col={col} onClose={() => setEditOpen(false)} />}
      {sampleOpen && <SampleDataModal col={col} onClose={() => setSampleOpen(false)} />}
    </div>
  );
}

/* ─── Source Detail Component ─── */

export function SourceDetail({ source, logoMap, onBack }) {
  const tables = useMemo(() => getTablesForSource(source.logoKey), [source.logoKey]);
  const [selectedTable, setSelectedTable] = useState(tables[0]?.name || '');
  const [panelOpen, setPanelOpen] = useState(true);
  const [tableSearch, setTableSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState('');
  const [tableEnabled, setTableEnabled] = useState(true);

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const currentTable = tables.find((t) => t.name === selectedTable);
  const filteredColumns = currentTable
    ? currentTable.columns.filter((c) =>
        c.name.toLowerCase().includes(columnSearch.toLowerCase())
        || c.column.toLowerCase().includes(columnSearch.toLowerCase())
      )
    : [];

  const enabledCount = currentTable ? currentTable.columns.filter((c) => c.enabled).length : 0;
  const totalCount = currentTable ? currentTable.columns.length : 0;

  return (
    <div className="dict-detail">
      {/* Left panel */}
      <div className={`dict-detail__sidebar ${panelOpen ? '' : 'dict-detail__sidebar--collapsed'}`}>
        <div className="dict-detail__sidebar-header">
          <span className="dict-detail__sidebar-title">Tables</span>
          <button
            type="button"
            className="dict-detail__sidebar-toggle"
            onClick={() => setPanelOpen(!panelOpen)}
            aria-label={panelOpen ? 'Collapse panel' : 'Expand panel'}
          >
            <CaretLeft size={16} weight="regular" />
          </button>
        </div>

        {panelOpen && (
          <>
            <div className="dict-detail__sidebar-search-row">
              <div className="dict-detail__sidebar-search">
                <MagnifyingGlass size={14} weight="regular" color="var(--color-text-secondary)" />
                <input
                  type="text"
                  className="dict-detail__sidebar-search-input"
                  placeholder="Search Tables/Columns"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                />
              </div>
              <Button variant="secondary" size="sm" icon={Funnel} />
            </div>

            <div className="dict-detail__sidebar-list">
              {filteredTables.map((table) => (
                <button
                  key={table.name}
                  type="button"
                  className={`dict-detail__sidebar-item ${selectedTable === table.name ? 'dict-detail__sidebar-item--active' : ''}`}
                  onClick={() => setSelectedTable(table.name)}
                >
                  <span className="dict-detail__sidebar-item-name">{table.name}</span>
                  <span className="dict-detail__sidebar-item-count">{table.columnCount}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right panel */}
      <div className="dict-detail__main">
        <div className="dict-detail__main-inner">
          {/* Source header + description */}
          <div className="dict-detail__source-section">
            <div className="dict-detail__source-header">
              {logoMap[source.logoKey] && (
                <img src={logoMap[source.logoKey]} alt="" className="dict-detail__source-logo" />
              )}
              <h2 className="dict-detail__source-name">{source.name}</h2>
            </div>
            <div className="dict-detail__source-desc-section">
              <span className="dict-detail__section-label">Description</span>
              <p className="dict-detail__source-desc">{source.description}</p>
            </div>
          </div>

          {/* Table detail */}
          {currentTable && (
            <>
              {/* Sticky table header */}
              <div className="dict-detail__table-header">
                <h3 className="dict-detail__table-name">{currentTable.name}</h3>
                <div className="dict-detail__table-meta">
                  <span className="dict-detail__meta-item">
                    <span className="dict-detail__meta-label">Default Columns</span>
                    <span className="dict-detail__meta-value">4</span>
                  </span>
                  <span className="dict-detail__meta-item">
                    <span className="dict-detail__meta-label">Columns Enabled</span>
                    <span className="dict-detail__meta-value">{enabledCount}/{totalCount}</span>
                  </span>
                  <span className="dict-detail__meta-item">
                    <span className="dict-detail__meta-label">Enable table for analysis</span>
                    <Toggle checked={tableEnabled} onChange={() => setTableEnabled(!tableEnabled)} />
                  </span>
                </div>
              </div>

              {/* Table body */}
              <div className="dict-detail__table-body">
                <div className="dict-detail__table-desc-section">
                  <span className="dict-detail__section-label">Description</span>
                  <p className="dict-detail__table-desc">{currentTable.description}</p>
                </div>

                {/* Columns */}
                <div className="dict-detail__columns-header">
                  <div className="dict-detail__columns-header-left">
                    <span className="dict-detail__columns-title">Columns</span>
                    <span className="dict-detail__columns-count">{totalCount}</span>
                    <button type="button" className="dict-detail__columns-select">Select</button>
                  </div>
                  <div className="dict-detail__columns-header-right">
                    <div className="dict-detail__column-search">
                      <MagnifyingGlass size={14} weight="regular" color="var(--color-text-secondary)" />
                      <input
                        type="text"
                        className="dict-detail__column-search-input"
                        placeholder="Search Columns"
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                      />
                    </div>
                    <Button variant="secondary" size="sm" icon={Funnel} />
                  </div>
                </div>

                {/* Columns table */}
                <div className="dict-detail__columns-table">
                  <div className="dict-detail__columns-table-header">
                    <span className="dict-detail__col-num">#</span>
                    <span className="dict-detail__col-expand" />
                    <span className="dict-detail__col-field">Field Name</span>
                    <span className="dict-detail__col-column">Column</span>
                    <span className="dict-detail__col-type">Data Type</span>
                    <span className="dict-detail__col-desc">Description</span>
                    <span className="dict-detail__col-sample">Sample Data</span>
                    <span className="dict-detail__col-toggle">Status</span>
                    <span className="dict-detail__col-edit" />
                  </div>
                  <div className="dict-detail__columns-rows">
                    {filteredColumns.map((col, i) => (
                      <ColumnRow key={col.column} index={i + 1} col={col} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
