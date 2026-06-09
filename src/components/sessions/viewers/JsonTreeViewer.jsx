import { useState, useEffect, useMemo } from "react";
import { Plus, Minus, ChevronDown } from "lucide-react";
import { getApiBase, getAuthToken } from "../../../api";

const MAX_AUTO_EXPAND_DEPTH = 1;
const ITEMS_PER_PAGE = 100;
const MAX_STRING_LENGTH = 300;

function TruncatedString({ value }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = value.length > MAX_STRING_LENGTH;

  if (!needsTruncation) {
    return <span className="json-tree__string">"{value}"</span>;
  }

  return (
    <span className="json-tree__string">
      "{expanded ? value : value.slice(0, MAX_STRING_LENGTH)}
      {!expanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          className="json-tree__show-more-inline"
        >
          ... +{value.length - MAX_STRING_LENGTH} chars
        </button>
      )}
      "
    </span>
  );
}

function TreeNode({ keyName, value, depth = 0, isLast = true, isArrayItem = false }) {
  const isObject = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);
  const [expanded, setExpanded] = useState(depth < MAX_AUTO_EXPAND_DEPTH);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const hasChildren = isObject && (isArray ? value.length > 0 : Object.keys(value).length > 0);

  const childEntries = useMemo(() => {
    if (!isObject) return [];
    return isArray ? value.map((item, index) => [index, item]) : Object.entries(value);
  }, [value, isObject, isArray]);

  const visibleEntries = childEntries.slice(0, visibleCount);
  const remainingCount = childEntries.length - visibleCount;

  const renderValue = () => {
    if (value === null) return <span className="json-tree__null">null</span>;
    if (value === undefined) return <span className="json-tree__undefined">undefined</span>;
    if (typeof value === "boolean") return <span className="json-tree__boolean">{value.toString()}</span>;
    if (typeof value === "number") return <span className="json-tree__number">{value}</span>;
    if (typeof value === "string") return <TruncatedString value={value} />;
    return null;
  };

  const getCollapsedPreview = () => {
    if (isArray) return `[...]`;
    return `{...}`;
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div className="json-tree__node">
      <div className="json-tree__row" style={{ paddingLeft: `${depth * 20}px` }}>
        {hasChildren ? (
          <button onClick={toggleExpand} className="json-tree__toggle" aria-label={expanded ? "Collapse" : "Expand"}>
            {expanded ? <Minus size={12} /> : <Plus size={12} />}
          </button>
        ) : (
          <span className="json-tree__leaf-spacer">—</span>
        )}

        <span className="json-tree__key">{isArrayItem ? `[${keyName}]` : keyName}</span>
        <span className="json-tree__colon">:</span>

        {isObject ? (
          expanded ? null : (
            <span className="json-tree__preview" onClick={toggleExpand}>
              {getCollapsedPreview()}
            </span>
          )
        ) : (
          renderValue()
        )}
      </div>

      {hasChildren && expanded && (
        <div className="json-tree__children">
          {visibleEntries.map(([key, val], index) => (
            <TreeNode
              key={key}
              keyName={key}
              value={val}
              depth={depth + 1}
              isLast={index === visibleEntries.length - 1 && remainingCount === 0}
              isArrayItem={isArray}
            />
          ))}
          {remainingCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
              }}
              className="json-tree__load-more"
              style={{ marginLeft: `${(depth + 1) * 20}px` }}
            >
              <ChevronDown size={14} />
              <span>
                Show {Math.min(remainingCount, ITEMS_PER_PAGE)} more ({remainingCount} remaining)
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function JSONTree({ data }) {
  const isArray = Array.isArray(data);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const entries = useMemo(() => {
    return isArray ? data.map((item, index) => [index, item]) : Object.entries(data);
  }, [data, isArray]);

  const visibleEntries = entries.slice(0, visibleCount);
  const remainingCount = entries.length - visibleCount;

  return (
    <div className="json-tree">
      {visibleEntries.map(([key, val], index) => (
        <TreeNode
          key={key}
          keyName={key}
          value={val}
          depth={0}
          isLast={index === visibleEntries.length - 1 && remainingCount === 0}
          isArrayItem={isArray}
        />
      ))}
      {remainingCount > 0 && (
        <button onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)} className="json-tree__load-more">
          <ChevronDown size={14} />
          <span>
            Show {Math.min(remainingCount, ITEMS_PER_PAGE)} more ({remainingCount} remaining)
          </span>
        </button>
      )}
    </div>
  );
}

export default function JsonTreeViewer({ sessionId, path, type, onLoadComplete }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId || !path) return;

    setLoading(true);
    setError(null);

    const url = `${getApiBase()}/api/sessions/${sessionId}/files/${path}?token=${encodeURIComponent(getAuthToken() || "")}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        try {
          if (type === "jsonl") {
            const lines = text.split("\n").filter((line) => line.trim());
            setData(lines.map((line) => JSON.parse(line)));
          } else {
            setData(JSON.parse(text));
          }
        } catch (e) {
          throw new Error("Failed to parse JSON");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        setLoading(false);
        onLoadComplete?.();
      });
  }, [sessionId, path, type, onLoadComplete]);

  if (loading) {
    return <div className="json-tree__loading">Loading JSON data...</div>;
  }

  if (error) {
    return <div className="json-tree__error">Failed to load data: {error}</div>;
  }

  if (!data) {
    return <div className="json-tree__error">Unable to parse JSON data</div>;
  }

  return (
    <div className="json-tree__container">
      <JSONTree data={data} />
    </div>
  );
}
