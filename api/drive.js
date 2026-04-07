module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  const { folderId } = req.query;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY environment variable not set' });
  }
  if (!folderId) {
    return res.status(400).json({ error: 'folderId query parameter required' });
  }

  try {
    const url = 'https://www.googleapis.com/drive/v3/files'
      + '?q=' + encodeURIComponent("'" + folderId + "' in parents and trashed=false")
      + '&key=' + apiKey
      + '&fields=' + encodeURIComponent('files(id,name,mimeType,size)')
      + '&pageSize=200&orderBy=name';

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(data.error.code || 500).json(data);
    }

    var files = (data.files || []).map(function(f) {
      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size ? Number(f.size) : 0,
        isFolder: f.mimeType === 'application/vnd.google-apps.folder',
        thumbnail: 'https://drive.google.com/thumbnail?id=' + f.id + '&sz=w400',
        downloadUrl: 'https://drive.google.com/uc?export=download&id=' + f.id,
        viewUrl: 'https://drive.google.com/file/d/' + f.id + '/view',
        previewUrl: 'https://drive.google.com/file/d/' + f.id + '/preview'
      };
    });

    res.json({ files: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
