import React from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Controller } from 'react-hook-form';

export default function RTE({ name, control, label, defaultValue = "" }) {
  return (
    <div className="w-full">
      {label && <label className="inline-block mb-1 pl-1">{label}</label>}

      <Controller
        name={name || "content"}
        control={control}
        render={({ field: { onChange, value } }) => (
          <Editor
            apiKey="o2d6muwvpwclbxdhdeh0clzb3t9m0pp0ts4888wyu7o7nrdg" // <- Replace with your TinyMCE API key
            value={value || defaultValue}
            init={{
              height: 500,
              menubar: true,
              plugins: [
                'searchreplace',
                'visualblocks',
                'code',
                'fullscreen',
                'advlist',
                'autolink',
                'lists',
                'link',
                'image',
                'charmap',
                'preview',
                'anchor',
                'insertdatetime',
                'media',
                'table',
                'help',
                'wordcount'
              ]
              ,
              toolbar:
                "undo redo | formatselect | bold italic underline forecolor backcolor | \
                alignleft aligncenter alignright alignjustify | \
                bullist numlist outdent indent | removeformat | help",
              content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }"
            }}
            onEditorChange={onChange}
          />
        )}
      />
    </div>
  );
}
