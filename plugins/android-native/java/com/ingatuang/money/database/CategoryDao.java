package com.ingatuang.money.database;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface CategoryDao {
    @Query("SELECT * FROM categories ORDER BY name ASC")
    List<CategoryEntity> getAllCategories();

    @Query("SELECT * FROM categories WHERE id = :id LIMIT 1")
    CategoryEntity getCategoryById(String id);

    @Query("SELECT * FROM categories WHERE type = :type ORDER BY name ASC")
    List<CategoryEntity> getCategoriesByType(String type);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    long insertCategory(CategoryEntity category);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertCategories(List<CategoryEntity> categories);

    @Update
    int updateCategory(CategoryEntity category);

    @Delete
    int deleteCategory(CategoryEntity category);

    @Query("DELETE FROM categories WHERE id = :id")
    int deleteCategoryById(String id);

    @Query("DELETE FROM categories")
    int deleteAllCategories();

    @Query("SELECT COUNT(*) FROM categories")
    int getCategoryCount();
}
