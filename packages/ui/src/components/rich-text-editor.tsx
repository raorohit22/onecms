import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const modules = {
  toolbar: [
    [{ font: [] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],
    [{ align: [] }],
    ['link', 'image', 'video', 'formula'],
    ['clean'],
  ],
};

const formats = [
  'font', 'header', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'blockquote', 'code-block',
  'list',
  'indent',
  'direction',
  'align',
  'link', 'image', 'video', 'formula',
];

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-muted/30 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[300px]">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
      />
    </div>
  );
}
