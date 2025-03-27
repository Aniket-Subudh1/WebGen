import { createContext } from 'react';

export const ActionContext = createContext({
  action: null,
  setAction: () => {}
});