
declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      'agent-id': string;
    }, HTMLElement>;
  }
}

// This type declaration makes TypeScript recognize the elevenlabs-convai custom element
// and defines that it requires an agent-id attribute
