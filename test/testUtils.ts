import fs from 'fs'
import path from 'path'
import { supabase } from '../src/config/supabase'

export interface TestFile {
  uri: string
  exists: boolean
}

export class FileTestHelper {
  static async ensureBucketExists() {
    if (process.env.NODE_ENV === 'production') {
      try {
        const client = supabase()
        if (!client) return false

        // Vérifier si le bucket existe
        const { data: buckets } = await client.storage.listBuckets()
        const bucketExists = buckets?.some((b) => b.name === 'data')

        // Créer le bucket s'il n'existe pas
        if (!bucketExists) {
          const { error } = await client.storage.createBucket('data', {
            public: false,
            allowedMimeTypes: [
              'image/*',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
            fileSizeLimit: 5242880, // 5MB
          })

          if (error) {
            console.error('Failed to create bucket:', error)
            return false
          }
          console.log('✅ Bucket "data" created in Supabase')
        }

        return true
      } catch (error) {
        console.error('Bucket setup error:', error)
        return false
      }
    }
    return true // Pas besoin en local
  }

  static async uploadTestFiles() {
    if (process.env.NODE_ENV === 'prod') {
      try {
        const client = supabase()
        if (!client) return false

        // Upload des fichiers de test pour les tests de production
        const testFiles = [
          { path: 'image/test.png', folder: 'profileImage' },
          { path: 'image/test2.png', folder: 'profileImage' },
          { path: 'prog/test.xlsx', folder: 'prog' },
        ]

        for (const file of testFiles) {
          const fullPath = path.join(__dirname, file.path)
          const fileBuffer = fs.readFileSync(fullPath)
          const filename = path.basename(file.path)

          await client.storage
            .from('data')
            .upload(`${file.folder}/${filename}`, fileBuffer, {
              contentType: file.path.endsWith('.png')
                ? 'image/png'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              upsert: true,
            })
        }

        console.log('✅ Test files uploaded to Supabase')
        return true
      } catch (error) {
        console.error('Failed to upload test files:', error)
        return false
      }
    }
    return true // Pas besoin en local
  }

  static async cleanupTestFiles() {
    if (process.env.NODE_ENV === 'prod') {
      try {
        const client = supabase()
        if (!client) return false

        // Supprimer uniquement les fichiers de test
        const testFiles = [
          'profileImage/test.png',
          'profileImage/test2.png',
          'prog/test.xlsx',
        ]

        await client.storage.from('data').remove(testFiles)

        console.log('🧹 Test files cleaned from Supabase')
        return true
      } catch (error) {
        console.error('Failed to cleanup test files:', error)
        return false
      }
    }
    return true // Pas besoin en local
  }

  static async checkFileExists(uri: string): Promise<TestFile> {
    if (process.env.NODE_ENV === 'prod') {
      // En production: vérifier sur Supabase
      try {
        const client = supabase()
        if (!client) {
          return { uri, exists: false }
        }

        // Normaliser: enlever un éventuel '/' au début
        const normalizedUri = uri.startsWith('/') ? uri.slice(1) : uri
        const parts = normalizedUri.split('/')
        const filename = parts.pop()
        const folder = parts.join('/')

        if (!filename) {
          return { uri, exists: false }
        }

        const { data, error } = await client.storage
          .from('data')
          .list(folder || undefined, { search: filename, limit: 100 })

        if (error) {
          return { uri, exists: false }
        }

        const exists =
          Array.isArray(data) && data.some((f) => f.name === filename)
        return { uri, exists }
      } catch {
        return { uri, exists: false }
      }
    } else {
      // En développement: vérifier localement
      const fullPath = path.join(process.cwd(), 'public', uri)
      return {
        uri,
        exists: fs.existsSync(fullPath),
      }
    }
  }

  static async expectFileExists(uri: string) {
    const result = await this.checkFileExists(uri)
    expect(result.exists).toBe(true)
    return result
  }

  static async expectFileNotExists(uri: string) {
    const result = await this.checkFileExists(uri)
    expect(result.exists).toBe(false)
    return result
  }

  static getTestImagePath(filename: string) {
    return path.join(__dirname, 'image', filename)
  }

  static getTestProgPath(filename: string) {
    return path.join(__dirname, 'prog', filename)
  }
}
