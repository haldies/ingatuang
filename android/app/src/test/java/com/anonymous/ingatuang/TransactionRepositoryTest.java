package com.anonymous.ingatuang;

import android.content.Context;
import androidx.room.Room;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import com.anonymous.ingatuang.database.AppDatabase;
import com.anonymous.ingatuang.database.TransactionEntity;
import com.anonymous.ingatuang.database.CategoryEntity;
import com.anonymous.ingatuang.repository.TransactionRepository;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.List;

import static org.junit.Assert.*;

/**
 * Unit tests for TransactionRepository
 * 
 * To run these tests:
 * ./gradlew test
 */
@RunWith(AndroidJUnit4.class)
public class TransactionRepositoryTest {
    private AppDatabase database;
    private TransactionRepository repository;

    @Before
    public void setup() {
        Context context = ApplicationProvider.getApplicationContext();
        
        // Create in-memory database for testing
        database = Room.inMemoryDatabaseBuilder(context, AppDatabase.class)
                .allowMainThreadQueries()
                .build();
        
        repository = new TransactionRepository(context);
    }

    @After
    public void tearDown() {
        database.close();
    }

    @Test
    public void testAddTransaction() {
        // Arrange
        TransactionEntity transaction = new TransactionEntity(
            "test1",
            100000.0,
            "INCOME",
            "2024-01-01T00:00:00.000Z",
            "1",
            "Test transaction",
            "2024-01-01T00:00:00.000Z"
        );

        // Act
        long result = repository.addTransaction(transaction);

        // Assert
        assertTrue("Transaction should be added successfully", result != -1);
    }

    @Test
    public void testGetAllTransactions() {
        // Arrange
        repository.addTransaction(new TransactionEntity(
            "test1", 100000.0, "INCOME", "2024-01-01", "1", "Test 1", "2024-01-01"
        ));
        repository.addTransaction(new TransactionEntity(
            "test2", 50000.0, "EXPENSE", "2024-01-02", "5", "Test 2", "2024-01-02"
        ));

        // Act
        List<TransactionEntity> transactions = repository.getAllTransactions();

        // Assert
        assertEquals("Should have 2 transactions", 2, transactions.size());
    }

    @Test
    public void testUpdateTransaction() {
        // Arrange
        TransactionEntity transaction = new TransactionEntity(
            "test1", 100000.0, "INCOME", "2024-01-01", "1", "Original", "2024-01-01"
        );
        repository.addTransaction(transaction);

        // Act
        transaction.setAmount(150000.0);
        transaction.setNotes("Updated");
        int result = repository.updateTransaction(transaction);

        // Assert
        assertTrue("Transaction should be updated", result > 0);
        
        TransactionEntity updated = repository.getTransactionById("test1");
        assertEquals("Amount should be updated", 150000.0, updated.getAmount(), 0.01);
        assertEquals("Notes should be updated", "Updated", updated.getNotes());
    }

    @Test
    public void testDeleteTransaction() {
        // Arrange
        repository.addTransaction(new TransactionEntity(
            "test1", 100000.0, "INCOME", "2024-01-01", "1", "Test", "2024-01-01"
        ));

        // Act
        int result = repository.deleteTransaction("test1");

        // Assert
        assertTrue("Transaction should be deleted", result > 0);
        assertNull("Transaction should not exist", repository.getTransactionById("test1"));
    }

    @Test
    public void testGetTransactionsByType() {
        // Arrange
        repository.addTransaction(new TransactionEntity(
            "test1", 100000.0, "INCOME", "2024-01-01", "1", "Income 1", "2024-01-01"
        ));
        repository.addTransaction(new TransactionEntity(
            "test2", 50000.0, "EXPENSE", "2024-01-02", "5", "Expense 1", "2024-01-02"
        ));
        repository.addTransaction(new TransactionEntity(
            "test3", 200000.0, "INCOME", "2024-01-03", "1", "Income 2", "2024-01-03"
        ));

        // Act
        List<TransactionEntity> incomeTransactions = repository.getTransactionsByType("INCOME");
        List<TransactionEntity> expenseTransactions = repository.getTransactionsByType("EXPENSE");

        // Assert
        assertEquals("Should have 2 income transactions", 2, incomeTransactions.size());
        assertEquals("Should have 1 expense transaction", 1, expenseTransactions.size());
    }

    @Test
    public void testGetAllCategories() {
        // Act
        List<CategoryEntity> categories = repository.getAllCategories();

        // Assert
        assertTrue("Should have default categories", categories.size() > 0);
        assertEquals("Should have 12 default categories", 12, categories.size());
    }

    @Test
    public void testGetCategoryById() {
        // Act
        CategoryEntity category = repository.getCategoryById("1");

        // Assert
        assertNotNull("Category should exist", category);
        assertEquals("Should be Gaji category", "Gaji", category.getName());
        assertEquals("Should be INCOME type", "INCOME", category.getType());
    }

    @Test
    public void testGetCategoriesByType() {
        // Act
        List<CategoryEntity> incomeCategories = repository.getCategoriesByType("INCOME");
        List<CategoryEntity> expenseCategories = repository.getCategoriesByType("EXPENSE");

        // Assert
        assertEquals("Should have 4 income categories", 4, incomeCategories.size());
        assertEquals("Should have 8 expense categories", 8, expenseCategories.size());
    }

    @Test
    public void testTransactionCount() {
        // Arrange
        repository.addTransaction(new TransactionEntity(
            "test1", 100000.0, "INCOME", "2024-01-01", "1", "Test 1", "2024-01-01"
        ));
        repository.addTransaction(new TransactionEntity(
            "test2", 50000.0, "EXPENSE", "2024-01-02", "5", "Test 2", "2024-01-02"
        ));

        // Act
        int count = repository.getTransactionCount();

        // Assert
        assertEquals("Should have 2 transactions", 2, count);
    }
}
