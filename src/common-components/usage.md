# Common Components

## Directory Structure

```
common-components/
├── assets/
│   └── spinner.gif
├── Button/
│   └── index.jsx
├── Checkbox/
│   └── index.jsx
├── Input/
│   └── index.jsx
├── Modal/
│   └── index.jsx
├── Radio/
│   └── index.jsx
├── Skeleton/
│   ├── index.jsx
│   └── SourcesSkeleton.jsx
├── Tabs/
│   └── index.jsx
├── Toggle/
│   └── index.jsx
├── Tooltip/
│   └── index.jsx
├── Popper/
│   └── index.jsx
├── index.js
└── usage.md
```

## Required Packages

```bash
npm install @mui/material @emotion/react @emotion/styled primereact tailwind-merge lodash @phosphor-icons/react
```

### Package Breakdown

| Package | Version | Used By |
|---------|---------|---------|
| `@mui/material` | ^5.x | Tooltip, Modal, Popper |
| `@emotion/react` | ^11.x | Tooltip, Modal (MUI peer dep) |
| `@emotion/styled` | ^11.x | Tooltip, Modal (MUI peer dep) |
| `primereact` | ^10.x | Skeleton, Radio, Input, Checkbox, Button, Tabs, Toggle |
| `tailwind-merge` | ^2.x | All components |
| `lodash` | ^4.x | Tooltip |
| `@phosphor-icons/react` | ^2.x | Input, Checkbox, Modal |
| `react` | ^18.x | All components |

## Tailwind CSS Classes Used

These components use custom Tailwind classes that must be defined in your `tailwind.config.js`:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontSize: {
        '1xs': '0.625rem', // 10px - used by Button sm size
      },
      colors: {
        'pv-neutral-grey-50': '#F8F9FC',
        'pv-neutral-grey-100': '#EEF0F7',
        'pv-neutral-grey-200': '#D8DCE9',
        'pv-neutral-grey-300': '#C4C9D9',
        'pv-neutral-grey-400': '#9CA3AF',
        'pv-neutral-grey-600': '#6B7280',
        'pv-neutral-grey-800': '#374151',
        'pv-neutral-grey-900': '#1F2937',
        'pv-primary-primary-50': '#EEF2FF',
        'pv-primary-primary-100': '#E0E7FF',
        'pv-primary-primary-300': '#A5B4FC',
        'pv-primary-primary-500': '#6366F1',
        'pv-primary-primary-800': '#3730A3',
        'pv-error-error-text': '#DC2626',
        'pv-warning-warning-text': '#D97706',
        'pv-text-primary-text': '#1F2937',
        'pv-text-secondary-text': '#6B7280',
        'brand-ai-100': '#6366F1',
        'brand-ai-800': '#A5B4FC',
        'brand-ai-1100': '#1E1B4B',
        'brand-ai-gray-500': '#E5E7EB',
        't-disabled': '#9CA3AF',
      },
    },
  },
};
```

## Component Props

### Tooltip

```jsx
import Tooltip from './Tooltip';

<Tooltip
  title="Tooltip content"           // React node
  arrow                              // boolean - show arrow
  placement="top"                    // 'top' | 'bottom' | 'left' | 'right' | etc.
  tooltipActive={true}               // boolean - enable/disable tooltip
  displayTooltipOnOverflow={false}   // boolean - only show if content overflows
  triggerResizeProps={[]}            // array - deps to trigger resize check
  disableHover={false}               // boolean - disable hover trigger
  disablePortal={false}              // boolean - render in place vs portal
  maxWidth="642px"                   // string - max tooltip width
  open={undefined}                   // boolean | undefined - controlled open state
  styles={{                          // object - custom styles
    tooltip: {},
    arrow: {},
  }}
>
  <span>Hover me</span>
</Tooltip>
```

### Skeleton

```jsx
import Skeleton from './Skeleton';

<Skeleton
  width="100px"          // string | number
  height="20px"          // string | number
  className=""           // string - additional classes
/>
```

### SourcesSkeleton

```jsx
import { SourcesSkeleton } from './Skeleton/SourcesSkeleton';

<SourcesSkeleton />
```

### Radio

```jsx
import Radio from './Radio';

<Radio
  id="radio-1"                    // string
  label="Option 1"                // string
  checked={false}                 // boolean
  disabled={false}                // boolean
  onChange={(e) => {}}            // function
  className={{
    wrapper: '',                  // string - wrapper classes
    label: '',                    // string - label classes
  }}
/>
```

### Input

```jsx
import Input from './Input';

<Input
  id="input-1"                    // string
  label="Label"                   // string
  value=""                        // string
  type="text"                     // 'text' | 'textarea'
  disabled={false}                // boolean
  required={false}                // boolean
  placeholder=""                  // string
  minRows={1}                     // number - textarea only
  maxRows={3}                     // number - textarea only
  dynamicWidth={false}            // boolean - auto-resize width
  dynamicMinWidth="10px"          // string
  dynamicMaxWidth="400px"         // string
  showClearInput={false}          // boolean - show X to clear
  clearTrigger={false}            // boolean - trigger clear reset
  leftElem={null}                 // React node
  rightElem={null}                // React node | function
  onChange={(e) => {}}            // function
  onKeyDown={(e) => {}}           // function
  onFocusChange={() => {}}        // function
  className={{
    wrapper: '',                  // string - outer wrapper
    label: '',                    // string - label classes
    input: {
      wrapper: '',                // string - input wrapper
      root: '',                   // string - input element
      clear: '',                  // string - clear icon
    },
  }}
/>
```

### Checkbox

```jsx
import Checkbox from './Checkbox';

<Checkbox
  id="checkbox-1"                    // string
  label="Check me"                   // string | React node
  checked={false}                    // boolean
  intermediate={false}               // boolean - show minus icon
  disabled={false}                   // boolean
  loading={false}                    // boolean - show spinner
  displayTooltip={false}             // boolean - show tooltip on label
  displayTooltipOnOverflow={false}   // boolean - tooltip only on overflow
  onChange={(e) => {}}               // function
  className={{
    wrapper: '',                     // string - outer wrapper
    checkboxWrapper: '',             // string - checkbox wrapper
    checkbox: '',                    // string - checkbox box
    label: '',                       // string - label classes
  }}
/>
```

### Button

```tsx
import { Button } from './Button';

<Button
  label="Click me"                   // string
  btnSize="md"                        // 'sm' | 'md' | 'lg' | 'xl'
  btnColor="primary"                  // 'primary' | 'primary red' | 'secondary' | 'ghost' | 'secondary ghost' | 'blue ghost' | 'transparent'
  type="button"                       // 'button' | 'submit' | 'reset'
  disabled={false}                    // boolean
  id="btn-1"                          // string
  className=""                        // string - wrapper classes
  mainBtnClassName=""                 // string - button element classes
  btnRef={null}                       // LegacyRef<PrButton>
  onClick={(e) => {}}                 // function
>
  {children}
</Button>
```

**Button Sizes:**
- `sm`: text-1xs, px-3 py-1.5, rounded-md
- `md`: text-xs, px-3 py-1.5, rounded-lg
- `lg`: text-sm font-medium, px-3 py-1.5, rounded-lg
- `xl`: text-base font-medium, px-6 py-2.5, rounded-lg

**Button Colors:**
- `primary`: Blue filled button
- `primary red`: Red filled button
- `secondary`: White with blue border
- `ghost`: Transparent with hover state
- `secondary ghost`: White with grey border
- `blue ghost`: Transparent blue text
- `transparent`: Fully transparent

### Tabs

```tsx
import { Tabs } from './Tabs';

<Tabs
  activeIndex={0}                     // number
  onTabChange={(e) => {}}             // function - e.index contains new index
  size="medium"                       // 'small' | 'medium' | 'large'
  extended={false}                    // boolean - extended padding
  disabled={false}                    // boolean
  showDefaultBottomBorder={true}      // boolean
  className=""                        // string
  navClassName=""                     // string - nav container classes
  headerClassName=""                  // string - header classes
  headerActionClassName=""            // string - header action classes
  activeBorderClassName=""            // string - active tab border classes
  styleClass={{ wrapper: {} }}        // object - inline styles
  tabData={[
    {
      label: "Tab 1",                 // string - tab label
      content: <div>Content 1</div>,  // ReactNode - tab content
      leftIcon: <Icon />,             // ReactNode - optional left icon
      RightIcon: <Icon />,            // ReactNode - optional right icon
    },
  ]}
/>
```

### Popper

```jsx
import { Popper } from './Popper';

// Basic usage
<Popper
  buttonChildren="Open Menu"
  placement="bottom-start"
>
  <div className="p-4">Popper content here</div>
</Popper>

// With render props for dynamic button content
<Popper
  buttonChildren={({ open }) => (
    <>
      <Icon weight={open ? 'fill' : 'regular'} />
      Files
    </>
  )}
  btnColor="secondary ghost"
  btnSize="sm"
  mainBtnClassName="rounded-full py-1 px-2 gap-1"
  popperClassName="w-[340px] h-[460px]"
>
  {({ close }) => (
    <div>
      <button onClick={close}>Close</button>
      <p>Content</p>
    </div>
  )}
</Popper>

// Controlled mode
const [open, setOpen] = useState(false);
<Popper
  buttonChildren="Toggle"
  open={open}
  onOpenChange={setOpen}
>
  <div>Controlled content</div>
</Popper>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `buttonChildren` | `ReactNode \| (({ open }) => ReactNode)` | required | Button content |
| `children` | `ReactNode \| (({ open, close }) => ReactNode)` | required | Popper content |
| `placement` | `string` | `'bottom-start'` | MUI Popper placement |
| `disablePortal` | `boolean` | `false` | Render in place vs portal |
| `fadeTimeout` | `number` | `200` | Fade transition duration (ms) |
| `zIndex` | `number` | `50` | Popper z-index |
| `open` | `boolean` | - | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | - | Called on open state change |
| `onClickAway` | `(event) => void` | - | Custom click away handler |
| `btnSize` | `string` | `'md'` | Button size |
| `btnColor` | `string` | `'secondary ghost'` | Button color variant |
| `buttonClassName` | `string` | `''` | Button wrapper classes |
| `mainBtnClassName` | `string` | `''` | Button element classes |
| `popperClassName` | `string` | `''` | Popper container classes |
| `popperStyle` | `object` | `{}` | Popper inline styles |
| `disabled` | `boolean` | `false` | Disable the button |
| `closeOnClickInside` | `boolean` | `false` | Close on click inside popper |
| `ignoreClickAwaySelectors` | `string[]` | `[]` | CSS selectors to ignore for click away |

### Toggle

```jsx
import { Toggle } from './Toggle';

<Toggle
  checked={false}                      // boolean - toggle state
  disabled={false}                     // boolean
  onChange={(e) => {}}                 // function - e.value contains new state
  onClick={(e) => {}}                  // function - click handler
/>
```

**Toggle States:**
- Unchecked: Grey background (`pv-neutral-grey-300`)
- Checked: Blue background (`pv-primary-primary-500`)
- Disabled unchecked: Light grey (`pv-neutral-grey-200`)
- Disabled checked: Light blue (`pv-primary-primary-300`)

### Modal (MUI)

```tsx
import { Modal } from './Modal';

<Modal
  isOpen={false}                      // boolean - controls visibility
  onClose={() => {}}                  // function - close handler
  title="Modal Title"                 // string
  variant="primary"                   // 'primary' | 'warning' | 'error'
  showHeader={true}                   // boolean
  showCloseBtn={true}                 // boolean
  center={true}                       // boolean - center or offset right
  className=""                        // string - modal container classes
  headerClassName=""                  // string - header classes
  titleClassName=""                   // string - title classes
  closeClassName=""                   // string - close button classes
  childClassName=""                   // string - content wrapper classes
  topBorderClassname=""               // string - top border classes
  topStripClassName=""                // string - top colored strip classes
  containerClassname=""               // string - outer container classes
  header={null}                       // ReactNode - custom header content
  styles={{
    modal: {},                        // CSSProperties - modal inline styles
  }}
  classes={{
    backdrop: '',                     // string - backdrop classes
  }}
>
  {children}
</Modal>
```

**Modal Variants:**
- `primary`: Blue top border (pv-primary-primary-500)
- `warning`: Yellow top border (pv-warning-warning-text)
- `error`: Red top border (pv-error-error-text)

## Internal Dependencies

- `Checkbox` imports `Tooltip` internally
- `Checkbox` imports `spinner.gif` from `../assets/`
- `SourcesSkeleton` imports `Skeleton` from `./index`
- `Modal` imports `Button` and `Tooltip` internally
- `Popper` imports `Button` internally

## PrimeReact Setup

PrimeReact requires CSS imports. Add to your entry file:

```js
import 'primereact/resources/primereact.min.css';
```

For the unstyled/passthrough mode used here, you may also need:

```js
import { PrimeReactProvider } from 'primereact/api';

<PrimeReactProvider value={{ unstyled: false, pt: {} }}>
  <App />
</PrimeReactProvider>
```

## MUI Setup

MUI Tooltip works out of the box. For SSR or custom themes:

```js
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({});

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```
