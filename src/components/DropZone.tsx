import IconDelete from '@mui/icons-material/Delete';
import IconDownload from '@mui/icons-material/Download';
import IconEast from '@mui/icons-material/East';
import { Divider, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import { alpha, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ImageWithMetadata,
  OptimizeApiResponse,
  ResFileObject,
  ResizeMetadata,
} from '../../types/TypesImageFileTypes';

function FileStats({ file, width, height }: ImageWithMetadata) {
  // ` | .${file.type.split('/')[1]}` +
  return (
    <Stack
      direction="row"
      spacing={1}
      divider={
        <Divider orientation="vertical" flexItem variant="middle" sx={{ borderWidth: `1px` }} />
      }
    >
      <Typography variant="body2">{`${(file.size / 1024).toFixed(2)} KB`}</Typography>
      <Typography variant="body2">{`${width}px × ${height}px`}</Typography>
    </Stack>
  );
}

function SavingsIcon({ originalSize, newSize = 0 }: { originalSize: number; newSize?: number }) {
  const theme = useTheme();
  const reducedPercent = Math.round(((originalSize - newSize) / originalSize) * 100);
  let savingsArrow = '-';
  if (reducedPercent < 0) savingsArrow = '↑';
  if (reducedPercent > 0) savingsArrow = '↓';

  const colorMode = theme.palette.mode === 'light' ? 'dark' : 'light';

  return (
    <ListItemText
      sx={{
        flex: 'initial',
        alignItems: 'center',
        mx: 2,
        textAlign: 'center',
        minWidth: '50px',
      }}
      primary={<IconEast />}
      secondary={`${savingsArrow} ${reducedPercent}%`}
      slotProps={{
        primary: { variant: 'h4', mb: 0, lineHeight: 1 },
        secondary: {
          sx: {
            color:
              reducedPercent < 0
                ? theme.palette.error[colorMode]
                : theme.palette.success[colorMode],
            fontWeight: 'bold',
          },
        },
      }}
    />
  );
}

export default function DropZone() {
  const theme = useTheme();
  const [files, setFiles] = useState<ImageWithMetadata[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    const existingFileNames = new Set(files.map(({ file }) => file.name));

    const uniqueFiles = acceptedFiles.filter((file) => !existingFileNames.has(file.name));

    const newFiles = await Promise.all(
      uniqueFiles.map(async (file, id) => {
        const { width, height } = await getImageMetadata(file);
        return { id, file, width, height, isOptimized: false };
      })
    );

    setFiles((prev) => [...newFiles, ...prev]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/apng': [],
      'image/bmp': [],
      'image/tiff': [],
    },
  });

  const getImageMetadata = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleClear = () => {
    setFiles([]);
    setZipUrl(null);
  };
  const handleDelete = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSetIsOptimized = (optimizedFile: ResFileObject) => {
    setFiles((prev) =>
      prev.map((img) =>
        img.id === optimizedFile.id ? { ...img, isOptimized: true, optimizedFile } : img
      )
    );
  };

  // To get Blob from base64 ZIP:
  function base64ToBlob(base64WithPrefix: string, defaultType = 'application/octet-stream') {
    const [prefix, base64] = base64WithPrefix.split(',');

    const typeMatch = prefix.match(/data:(.*);base64/);
    const type = typeMatch ? typeMatch[1] : defaultType;

    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

    return new Blob([bytes], { type });
  }

  const handleProcess = async () => {
    const formData = new FormData();

    // Add files
    files.forEach(({ file }) => {
      formData.append('files', file);
    });

    // Add metadata as JSON string
    const metadata: ResizeMetadata[] = files.map(
      ({ id, file, width, height, resizeWidth, resizeHeight, isOptimized }) => ({
        id,
        name: file.name,
        width,
        height,
        resizeWidth,
        resizeHeight,
        isOptimized,
      })
    );

    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

    const res = await fetch('/api/optimize', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Upload failed');

    const data: OptimizeApiResponse = await res.json();
    const zipBlob = base64ToBlob(data.zippedImages.file);
    const url = URL.createObjectURL(zipBlob);

    data.optimizedImages.forEach((optimizedFile: ResFileObject) => {
      handleSetIsOptimized(optimizedFile);
    });

    setZipUrl(url);
  };

  return (
    <Box p={4}>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed gray',
          padding: 4,
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 2,
          backgroundColor: isDragActive ? 'rgba(0,0,0,0.05)' : 'inherit',
        }}
      >
        <input {...getInputProps()} />
        <Typography>Drag and drop images here</Typography>
      </Box>
      <List>
        {files.map((fileObject: ImageWithMetadata, i) => {
          const { file, isOptimized } = fileObject;
          // console.log(file);
          return (
            <Paper
              key={i}
              sx={{
                mb: 1,
                border: `2px solid transparent`,
                borderColor: isOptimized ? theme.palette.success.main : null,
                background: isOptimized ? `${alpha(theme.palette.success.main, 0.1)}` : null,
                transition:
                  `background ${theme.transitions.easing.easeIn} ${theme.transitions.duration.short}ms` +
                  `, border-color ${theme.transitions.easing.easeIn} ${theme.transitions.duration.short}ms`,
              }}
            >
              <ListItem
                secondaryAction={
                  <Box>
                    {isOptimized ? (
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(i)}>
                        <IconDownload />
                      </IconButton>
                    ) : (
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(i)}>
                        <IconDelete />
                      </IconButton>
                    )}
                  </Box>
                }
                sx={{
                  gap: theme.spacing(3),
                  pr: 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                  '.MuiListItemSecondaryAction-root': {
                    position: 'initial',
                    right: 'initial',
                    top: 'initial',
                    transform: 'initial',
                    minWidth: 40,
                  },
                }}
              >
                <Box sx={{ width: '175px' }}>
                  <Box
                    component="img"
                    src={URL.createObjectURL(file)}
                    alt={fileObject.file.name}
                    sx={{ height: '100%', width: '100%' }}
                  />
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}
                >
                  <ListItemText
                    sx={{ flex: '1' }}
                    primary={file.name}
                    secondary={FileStats(fileObject)}
                    slotProps={{
                      primary: { variant: 'h5', mb: 0.5 },
                      secondary: { component: 'div' },
                    }}
                  />
                  {isOptimized && (
                    <>
                      <SavingsIcon
                        originalSize={file.size}
                        newSize={fileObject.optimizedFile?.size}
                      />
                      <ListItemText
                        sx={{
                          flex: 1,
                          justifyContent: 'flex-end',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                        }}
                        primary={fileObject.optimizedFile?.name ?? 'unknown'}
                        secondary={FileStats({
                          id: fileObject.id,
                          width: fileObject.optimizedFile?.width ?? 0,
                          height: fileObject.optimizedFile?.height ?? 0,
                          isOptimized: true,
                          file: {
                            ...fileObject.file,
                            name: fileObject.optimizedFile?.name ?? 'unknown',
                            size: fileObject.optimizedFile?.size ?? 0,
                            type: fileObject.optimizedFile?.mimeType ?? 'image/unknown',
                          },
                        })}
                        slotProps={{
                          primary: { variant: 'h5', mb: 0.5 },
                          secondary: { component: 'div' },
                        }}
                      />
                    </>
                  )}
                </Box>
              </ListItem>
            </Paper>
          );
        })}
      </List>
      <Box sx={{ display: 'flex' }}>
        <Stack spacing={3} direction="row" sx={{ flex: 1 }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleProcess}
            disabled={!files.length}
          >
            Optimize
          </Button>
          <Button
            component="a"
            href={zipUrl}
            download="images.zip"
            variant="outlined"
            disabled={!files.length || !zipUrl}
          >
            Download ZIP
          </Button>
        </Stack>
        <Button color="error" variant="outlined" disabled={!files.length} onClick={handleClear}>
          Clear Files
        </Button>
      </Box>
      {zipUrl && <Box mt={4}></Box>}
    </Box>
  );
}
