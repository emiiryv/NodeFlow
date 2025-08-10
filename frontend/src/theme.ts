// src/theme.ts
import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'grape', // Mor ton
  defaultRadius: 'lg',
  components: {
    Button: {
      defaultProps: {
        radius: 'lg',
        size: 'md',
      },
    },
    Anchor: {
      defaultProps: {
        c: 'grape',
        underline: 'hover',
        size: 'sm',
        fw: 500,
      },
      styles: {
        root: {
          fontWeight: 500,
          paddingLeft: rem(8),
          paddingRight: rem(8),
        },
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: 'md',
        variant: 'subtle',
        color: 'grape',
      },
    },
  },
});