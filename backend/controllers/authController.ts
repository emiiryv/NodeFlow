import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../models/db';
import { Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, username, tenantId } = req.body;

    if (!email || !password || !name || !username) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Bu e-posta zaten kayıtlı.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let tenantIdToUse = tenantId ? Number(tenantId) : null;

    if (!tenantIdToUse) {
      const newTenant = await prisma.tenant.create({
        data: {
          name: `${username}'s Workspace`
        }
      });
      tenantIdToUse = newTenant.id;
    }
    // Create the user and associate with the tenant
    const user = await prisma.user.create({
      data: {
        email,
        name,
        username,
        password: hashedPassword,
        tenantId: tenantIdToUse,
      },
    });

    res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu.', user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Kayıt sırasında bir hata oluştu.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'E-posta ve şifre zorunludur.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri.' });
    }

    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: 'Giriş başarılı.', token });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Giriş sırasında bir hata oluştu.' });
  }
};