# Debug Tips & Tricks

## React/Frontend Debugging

### Console Logging
- Add targeted `console.log` statements to state variables
- Log state changes with `useEffect` to track what triggers re-renders
- Example: `useEffect(() => console.log({ phase, turn }), [phase, turn])`

### Debug Overlays
- When debugging UI/positioning issues, add temporary CSS/HTML overlays
- Use `outline: 2px solid red` on elements to see their bounds
- Add floating debug panel showing key state variables

### React DevTools
- Use React DevTools browser extension to inspect component state
- Check "Highlight updates" to see what re-renders

### Common Issues
- State updates not reflecting: Check for stale closures in useEffect/useCallback
- UI not updating: Verify state is actually changing (console.log before setX)
- Race conditions: Log state BEFORE and AFTER setter calls
