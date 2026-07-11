import { XCircle, Eye, EyeSlash } from "@phosphor-icons/react";
import { Button } from "@/ui";
import { InputText as PRInputText } from "primereact/inputtext";
import { InputTextarea as PRInputTextarea } from "primereact/inputtextarea";
import { useRef, useState, useEffect } from "react";
import { twJoin, twMerge } from "tailwind-merge";

export default function Input({
  leftElem,
  rightElem,
  showClearInput,
  value,
  className,
  onKeyDown,
  label,
  id,
  type = "text",
  disabled = false,
  minRows = 1,
  maxRows = 3,
  dynamicWidth,
  dynamicMinWidth = "10px",
  dynamicMaxWidth = "400px",
  required = false,
  onChange = () => {},
  onFocusChange = () => {},
  clearTrigger = false,
  inputRef: externalRef,
  ...props
}) {
  const [focusInput, setFocusInput] = useState(false);
  const [textAreaRows, setTextAreaRows] = useState(minRows);
  const [showPassword, setShowPassword] = useState(false);
  const divRef = useRef(null);
  const internalRef = useRef(null);
  const inputRef = externalRef || internalRef;

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const handleInputResize = (text) => {
    const input = inputRef.current;
    if (!input) return;
    if (!text) {
      input.style.width = "10px";
      return;
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const styles = window.getComputedStyle(input);
    context.font = `
    ${styles.fontStyle}
    ${styles.fontVariant}
    ${styles.fontWeight}
    ${styles.fontSize}
    / ${styles.lineHeight}
    ${styles.fontFamily}
  `;
    const textWidth = context.measureText(text).width;
    const padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight) + 2;
    input.style.width = `${Math.ceil(textWidth + padding)}px`;
  };

  useEffect(() => {
    if (!focusInput && !value) {
      onFocusChange();
    }
  }, [focusInput]);

  const onTextChange = (event) => {
    onChange(event);
    if (inputRef.current && dynamicWidth) {
      handleInputResize(event.target.value);
    }
  };

  const keyDownHandler = (e) => {
    if (e.key === "Enter" && inputRef.current) {
      inputRef.current.blur();
    }
    onKeyDown && onKeyDown(e);
  };

  useEffect(() => {
    if (dynamicWidth) handleInputResize(value);
  }, [value]);

  function handleRowResize() {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.rows = minRows;
    textarea.style.overflowY = "hidden";

    if (!value || value.length === 0) {
      setTextAreaRows(minRows);
      return;
    }

    const styles = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(styles.lineHeight) || 20;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;

    const contentHeight = textarea.scrollHeight - paddingTop - paddingBottom;
    const currentRows = Math.round(contentHeight / lineHeight);

    const targetRows = Math.max(minRows, Math.min(currentRows, maxRows));

    textarea.rows = targetRows;
    textarea.style.overflowY = targetRows >= maxRows && currentRows > maxRows ? "scroll" : "hidden";
    setTextAreaRows(targetRows);
  }

  useEffect(() => {
    if (type === "textarea") {
      handleRowResize();
    }
  }, [value, minRows, maxRows]);

  function clearInput(event) {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = "";
      if (type === "textarea") {
        inputRef.current.rows = minRows;
        setTextAreaRows(minRows);
      }
    }
    onChange({ ...event, target: { ...event.target, value: "" } });
  }

  useEffect(() => {
    if (clearTrigger && value === "" && type === "textarea") {
      setTextAreaRows(minRows);
    }
  }, [value, clearTrigger, minRows, type]);

  useEffect(() => {
    function setInputFocus(e) {
      setFocusInput(true);
    }

    function removeInputFocus() {
      setFocusInput(false);
    }

    if (divRef.current) {
      divRef.current.addEventListener("focusin", setInputFocus);
      divRef.current.addEventListener("focusout", removeInputFocus);
    }

    return () => {
      if (divRef.current) {
        divRef.current.removeEventListener("focusin", setInputFocus);
        divRef.current.removeEventListener("focusout", removeInputFocus);
      }
    };
  }, []);

  return (
    <div className={twMerge("flex flex-col gap-1.5", !dynamicWidth && "w-full", twJoin(className?.wrapper && className.wrapper))}>
      {label ? (
        <label
          htmlFor={id}
          className={twMerge("text-grey-900 text-sm", twJoin(className?.label && className.label))}
        >
          {label}
          {required ? <span className="text-primary-500">*</span> : null}
        </label>
      ) : null}
      <div
        ref={divRef}
        className={twMerge(
          "flex flex-1 items-center border border-grey-200 rounded-lg py-3 px-4 bg-white focus-within:border-primary-500",
          twJoin(
            focusInput && "border-primary-500",
            !disabled && !focusInput && "hover:border-primary-300",
            disabled && "bg-grey-50 cursor-not-allowed",
            className?.input?.wrapper && className.input.wrapper
          )
        )}
      >
        {leftElem && <span className="mr-1.5">{leftElem}</span>}
        {type !== "textarea" ? (
          <PRInputText
            type={inputType}
            pt={{
              root: {
                className: twMerge(
                  "pv-input shadow-none rounded-none w-full resize-none outline-none text-sm text-grey-900 placeholder:text-[var(--text-secondary)] bg-transparent autofill:[-webkit-text-fill-color:inherit] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  twJoin(className?.input?.root && className.input.root),
                  disabled
                    ? "cursor-not-allowed autofill:shadow-[inset_0_0_0px_1000px_var(--color-grey-50)]"
                    : "autofill:shadow-[inset_0_0_0px_1000px_white]"
                ),
                style: {
                  ...(dynamicWidth && {
                    minWidth: dynamicMinWidth,
                    maxWidth: dynamicMaxWidth
                  })
                }
              }
            }}
            {...(id && { id })}
            {...(typeof value !== "undefined" && { value })}
            ref={inputRef}
            onChange={onTextChange}
            disabled={disabled}
            onKeyDown={keyDownHandler}
            {...props}
          />
        ) : (
          <PRInputTextarea
            rows={textAreaRows}
            onChange={onChange}
            pt={{
              root: {
                className: twMerge(
                  "pv-textarea shadow-none rounded-none w-full resize-none outline-none text-sm text-grey-900 placeholder:text-[var(--text-secondary)] bg-transparent",
                  twJoin(className?.input?.root && className.input.root),
                  disabled ? `cursor-not-allowed` : ``
                )
              }
            }}
            {...(id && { id })}
            {...(typeof value !== "undefined" && { value })}
            disabled={disabled}
            onKeyDown={onKeyDown}
            ref={inputRef}
            {...props}
          />
        )}
        {showClearInput && value?.length > 0 && (
          <XCircle
            size={16}
            className={twMerge(
              "text-grey-600 hover:text-grey-900 ml-2 cursor-pointer",
              className?.input?.clear && className.input.clear
            )}
            onClick={clearInput}
          />
        )}
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPassword(!showPassword)}
            className="ml-2 px-1 py-0"
          >
            {showPassword ? <Eye size={18} /> : <EyeSlash size={18} />}
          </Button>
        )}
        {rightElem && <span className="ml-1.5">{typeof rightElem === "function" ? rightElem() : rightElem}</span>}
      </div>
    </div>
  );
}
