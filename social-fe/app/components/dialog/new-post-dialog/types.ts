export type CustomReplySettings = {
  followers: boolean;
  following: boolean;
  mentioned: boolean;
};

export type PostComposerTheme = {
  id: string;
  label: string;
  background: string;
  textColor: string;
  placeholderColor: string;
  swatch: string;
};

export type SubmitButtonProps = {
  isPending: boolean;
  isSubmitDisabled: boolean;
  onSubmit: () => void;
};
